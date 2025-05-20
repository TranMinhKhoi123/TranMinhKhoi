// Lấy các phần tử DOM
const walletForm = document.getElementById('walletForm');
const walletInput = document.getElementById('walletAddress');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const nftGrid = document.getElementById('nftGrid');
const nftTemplate = document.getElementById('nftTemplate');

// Hàm hiển thị loading
function showLoading() {
    loadingElement.classList.remove('d-none');
    errorElement.classList.add('d-none');
    nftGrid.innerHTML = '';
}

// Hàm ẩn loading
function hideLoading() {
    loadingElement.classList.add('d-none');
}

// Hàm hiển thị lỗi
function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

// Hàm tạo thẻ thuộc tính
function createAttributeTag(trait_type, value) {
    const tag = document.createElement('span');
    tag.className = 'attribute-tag';
    tag.textContent = `${trait_type}: ${value}`;
    return tag;
}

// Hàm hiển thị một NFT
function displayNFT(nft) {
    const template = nftTemplate.content.cloneNode(true);
    
    // Cập nhật thông tin NFT
    template.querySelector('.token-id').textContent = nft.tokenId;
    template.querySelector('.nft-name').textContent = nft.name;
    template.querySelector('.description').textContent = nft.description;
    
    // Cập nhật hình ảnh
    const imgElement = template.querySelector('.nft-image');
    imgElement.src = nft.image;
    imgElement.alt = `${nft.name} - Token ID: ${nft.tokenId}`;
    
    // Thêm các thuộc tính
    const attributesContainer = template.querySelector('.attributes');
    if (nft.attributes && nft.attributes.length > 0) {
        nft.attributes.forEach(attr => {
            if (attr.trait_type && attr.value) {
                const attributeTag = createAttributeTag(attr.trait_type, attr.value);
                attributesContainer.appendChild(attributeTag);
            }
        });
    }
    
    nftGrid.appendChild(template);
}

// Hàm kiểm tra địa chỉ ví Ethereum hợp lệ
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Xử lý sự kiện submit form
walletForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const walletAddress = walletInput.value.trim();
    
    if (!walletAddress) {
        showError('Vui lòng nhập địa chỉ ví');
        return;
    }

    if (!isValidEthereumAddress(walletAddress)) {
        showError('Địa chỉ ví không đúng định dạng. Vui lòng nhập địa chỉ bắt đầu bằng 0x và có 42 ký tự');
        return;
    }
    
    showLoading();
    
    try {
        // Gọi API để lấy danh sách NFT
        const response = await fetch(`/api/nfts?address=${walletAddress}`);
        const data = await response.json();

        if (!data.success) {
            showError(data.error || 'Có lỗi xảy ra khi lấy thông tin NFT');
            return;
        }

        if (data.message) {
            showError(data.message);
            nftGrid.innerHTML = '';
            return;
        }

        // Hiển thị NFTs
        displayNFTs(data.nfts);
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
});