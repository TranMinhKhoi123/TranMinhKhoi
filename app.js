// Import các thư viện cần thiết
const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình để phục vụ các file tĩnh từ thư mục public
app.use(express.static('public'));
app.use(express.json());

// Khởi tạo provider để kết nối với mạng BASE Mainnet
const BASE_RPC_URLS = [
    'https://mainnet.base.org',
    'https://base.blockpi.network/v1/rpc/public',
    'https://base.meowrpc.com'
];

async function initializeProvider() {
    let provider = null;
    let error = null;

    // Thử kết nối với Alchemy nếu có API key hợp lệ
    if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'demo-key') {
        try {
            provider = new ethers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
            await provider.getNetwork();
            console.log('Đã kết nối thành công với Alchemy');
            return provider;
        } catch (e) {
            console.log('Không thể kết nối với Alchemy:', e.message);
            error = e;
        }
    }

    // Thử kết nối với các RPC công khai
    for (const url of BASE_RPC_URLS) {
        try {
            provider = new ethers.JsonRpcProvider(url);
            await provider.getNetwork();
            console.log('Đã kết nối thành công với:', url);
            return provider;
        } catch (e) {
            console.log(`Không thể kết nối với ${url}:`, e.message);
            error = e;
        }
    }

    // Nếu không thể kết nối với bất kỳ provider nào
    throw error || new Error('Không thể kết nối với bất kỳ provider nào');
}

// Khởi tạo provider
let provider;
initializeProvider()
    .then(p => {
        provider = p;
        return provider.getNetwork();
    })
    .then(network => {
        console.log('Đã kết nối với mạng:', network.name);
    })
    .catch(error => {
        console.error('Lỗi khởi tạo provider:', error);
    });

// ABI tối thiểu để truy vấn metadata của NFT
const minimalABI = [
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

// Biến lưu trữ contract instance
let nftContract = null;

// Hàm delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Hàm retry helper
async function retry(fn, retries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.log(`Lần thử ${i + 1} thất bại:`, error.message);
            lastError = error;
            if (error?.info?.error?.message === 'over rate limit') {
                await delay(delayMs * (i + 1)); // Tăng thời gian chờ mỗi lần retry
                continue;
            }
            throw error; // Nếu không phải lỗi rate limit thì throw ngay
        }
    }
    throw lastError;
}

// Hàm khởi tạo contract
async function initializeContract() {
    try {
        // Đợi provider khởi tạo hoàn tất
        const network = await provider.getNetwork();
        console.log('Khởi tạo contract trên mạng:', network.name);
        
        // Tạo contract instance
        nftContract = new ethers.Contract(
            process.env.NFT_CONTRACT_ADDRESS,
            minimalABI,
            provider
        );
        
        // Kiểm tra contract có hoạt động không
        const code = await provider.getCode(process.env.NFT_CONTRACT_ADDRESS);
        if (code === '0x') {
            throw new Error('Không tìm thấy smart contract tại địa chỉ này');
        }
        
        console.log('Khởi tạo contract thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo contract:', error);
        throw error;
    }
}

// API endpoint để lấy danh sách NFT của một địa chỉ ví
app.post('/api/nfts', async (req, res) => {
    // Kiểm tra contract đã được khởi tạo chưa
    if (!nftContract) {
        try {
            await initializeContract();
        } catch (error) {
            return res.status(500).json({ error: 'Không thể kết nối với smart contract. Vui lòng thử lại sau.' });
        }
    }
    try {
        console.log('Received request body:', req.body);
        const { walletAddress } = req.body;
        
        // Log địa chỉ ví để debug
        console.log('Processing wallet address:', walletAddress);

        // Kiểm tra địa chỉ ví có hợp lệ không
        if (!walletAddress) {
            console.log('Wallet address is empty');
            return res.status(400).json({ error: 'Vui lòng nhập địa chỉ ví' });
        }

        if (!ethers.isAddress(walletAddress)) {
            console.log('Invalid wallet address format:', walletAddress);
            return res.status(400).json({ error: 'Địa chỉ ví không đúng định dạng' });
        }

        // Lấy số lượng NFT của ví với retry logic
        console.log('Fetching NFT balance for address:', walletAddress);
        const balance = await retry(async () => {
            return await nftContract.balanceOf(walletAddress);
        });
        console.log('NFT balance:', balance.toString());
        const nfts = [];

        if (balance.toString() === '0') {
            return res.json({
                success: true,
                message: 'Không tìm thấy NFT nào trong ví này',
                nfts: []
            });
        }

        // Lấy thông tin của từng NFT
        for (let i = 0; i < balance; i++) {
            try {
                // Lấy token ID với retry và xử lý lỗi execution reverted
                let tokenId;
                try {
                    tokenId = await retry(async () => {
                        return await nftContract.tokenOfOwnerByIndex(walletAddress, i);
                    });
                } catch (error) {
                    if (error?.info?.error?.message === 'execution reverted') {
                        console.log(`NFT thứ ${i} không tồn tại hoặc không thuộc sở hữu của ví`);
                        continue;
                    }
                    throw error;
                }
                
                // Lấy metadata URI với retry
                const tokenUri = await retry(async () => {
                    return await nftContract.tokenURI(tokenId);
                });
                
                // Lấy metadata với retry
                const metadata = await retry(async () => {
                    const response = await fetch(tokenUri);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return await response.json();
                });

                nfts.push({
                    tokenId: tokenId.toString(),
                    name: metadata.name || 'Không có tên',
                    image: metadata.image || '',
                    description: metadata.description || 'Không có mô tả',
                    attributes: metadata.attributes || []
                });
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin NFT ${i}:`, error);
            }
        }

        res.json({ nfts });
    } catch (error) {
        console.error('Lỗi server:', error);
        let errorMessage = 'Có lỗi xảy ra khi truy vấn NFT';
        
        if (error.code === 'INVALID_ARGUMENT') {
            errorMessage = 'Địa chỉ ví không hợp lệ';
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage = 'Không thể kết nối với mạng BASE Mainnet';
        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = 'Không thể truy vấn hợp đồng NFT';
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Khởi động server sau khi đã khởi tạo provider và contract
async function startServer() {
    try {
        // Đợi provider khởi tạo
        const p = await initializeProvider();
        provider = p;
        console.log('Provider đã sẵn sàng');

        // Khởi tạo contract
        await initializeContract();
        console.log('Contract đã sẵn sàng');

        // Khởi động server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Lỗi khởi động server:', error);
        process.exit(1);
    }
}

// Bắt đầu khởi động server
startServer();