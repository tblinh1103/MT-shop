document.addEventListener('DOMContentLoaded', async function () {
    const categoryInput = document.getElementById('category');
    const variantsTable = document.getElementById('variants-table').querySelector('tbody');
    const variantCards = {
        'Điện thoại': document.querySelector('.card-phone-variant'),
        'Laptop': document.querySelector('.card-laptop-variant'),
        'Chuột': document.querySelector('.card-mouse-variant'),
        'Bàn phím': document.querySelector('.card-keyboard-variant'),
        'Củ sạc': document.querySelector('.card-charging-adapter-variant'),
        'Cáp sạc': document.querySelector('.card-charging-cable-variant')
    };

    function hideAllVariantCards() {
        Object.values(variantCards).forEach(card => card.style.display = 'none');
    }

    function showVariantCard(categoryName) {
        hideAllVariantCards();
        if (variantCards[categoryName]) {
            variantCards[categoryName].style.display = 'block';
        }
    }

    // Lấy token từ localStorage / sessionStorage
    const token = localStorage.getItem('token') || ''; // hoặc sessionStorage.getItem('token')

    async function loadBrands() {
        try {
            const response = await fetch('http://localhost:8080/tech-store/api/brands', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            const brandSelect = document.getElementById('brand');
            brandSelect.innerHTML = '';
            data.result.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.brandId;
                option.textContent = brand.brandName;
                brandSelect.appendChild(option);
            });
        } catch (err) {
            console.error('Không load được brand:', err);
        }
    }

    function fillProductInfo(product) {
        document.getElementById('productName').value = product.productName || '';
        document.getElementById('category').value = product.category?.categoryName || '';
        document.getElementById('warrantyMonths').value = product.warrantyMonths || '';
        document.getElementById('productStatus').value = product.productStatus || 'ACTIVE';
        if (product.brand?.brandId) {
            document.getElementById('brand').value = product.brand.brandId;
        }

        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = '';
        if (product.images) {
            product.images.forEach(img => {
                const image = document.createElement('img');
                image.src = img.imageUrl;
                image.style.width = '100px';
                image.style.height = '100px';
                image.style.objectFit = 'cover';
                imagePreview.appendChild(image);
            });
        }
    }

    function fillVariantCard(variant) {
        const categoryName = variant.categoryName || document.getElementById('category').value;
        const card = variantCards[categoryName];
        if (!card) return;

        const inputs = card.querySelectorAll('input, select');
        inputs.forEach(input => {
            const id = input.id;
            const spec = variant.productSpecs?.find(s => s.specKey === id);
            if (spec) {
                input.value = spec.specValue;
            } else if (variant[id] !== undefined) {
                input.value = variant[id];
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');

    try {
        await loadBrands();

        const response = await fetch(`http://localhost:8080/tech-store/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Không lấy được thông tin sản phẩm');
        const data = await response.json();
        const product = data.result;

        fillProductInfo(product);
        showVariantCard(product.category?.categoryName);

        if (product.productVariants && product.productVariants.length > 0) {
            window.productVariants = product.productVariants;

            const defaultVariant = product.productVariants.find(v => v.isDefault);
            if (defaultVariant) fillVariantCard(defaultVariant);

            variantsTable.innerHTML = '';
            product.productVariants.forEach(variant => {
                const row = document.createElement('tr');
                row.innerHTML = `
          <td>${variant.color || ''}</td>
          <td>${variant.originalPrice || ''}</td>
          <td>${variant.promotionalPrice || ''}</td>
          <td>${variant.stock || ''}</td>
          <td>${variant.isDefault ? 'TRUE' : 'FALSE'}</td>
          <td class="align-middle">
              <button class="btn btn-sm btn-warning text-white toggle-status" title="Đổi trạng thái">
                <i class="bx ${variant.isDefault
                        ? "bxs-lock-open"
                        : "bxs-lock"
                    }"></i>
              </button>
              <button class="btn btn-sm btn-primary text-white" onclick="editProductVariant('${variant.productVariantId
                    }')">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-danger text-white" onclick="deleteProductVariant('${variant.productVariantId
                    }')">
                <i class="bx bx-trash"></i>
              </button>
            </td>
        `;
                variantsTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Lỗi khi load sản phẩm:', error);
    }

    variantsTable.addEventListener('click', function (e) {
        const row = e.target.closest('tr');
        if (!row) return;
        const index = Array.from(row.parentNode.children).indexOf(row);
        const variant = window.productVariants[index];
        if (variant) {
            showVariantCard(document.getElementById('category').value);
            fillVariantCard(variant);
        }
    });

    categoryInput.addEventListener('change', function () {
        const category = this.value;
        showVariantCard(category);
        const defaultVariant = window.productVariants?.find(v => v.isDefault);
        if (defaultVariant) fillVariantCard(defaultVariant);
    });

    const productImageInput = document.getElementById('productImage');
    productImageInput.addEventListener('change', function () {
        const files = Array.from(this.files);
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = '';
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                imagePreview.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    });
});