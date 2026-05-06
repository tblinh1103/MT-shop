document.addEventListener('DOMContentLoaded', async function () {

    // ------------------------------
    // Khai báo biến
    // ------------------------------
    const token = localStorage.getItem('token') || '';
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const brandSelect = document.getElementById('brand');
    const variantsTable = document.getElementById('variants-table').querySelector('tbody');
    const variantCards = {
        'Điện thoại': document.querySelector('.card-phone-variant'),
        'Laptop': document.querySelector('.card-laptop-variant'),
        'Chuột': document.querySelector('.card-mouse-variant'),
        'Bàn phím': document.querySelector('.card-keyboard-variant'),
        'Củ sạc': document.querySelector('.card-charging-adapter-variant'),
        'Cáp sạc': document.querySelector('.card-charging-cable-variant')
    };

    // ------------------------------
    // Các hàm ẩn hiện variant
    // ------------------------------
    function hideAllVariantCards() {
        Object.values(variantCards).forEach(card => card.style.display = 'none');
    }

    // ------------------------------
    // Hàm hiện variant theo category
    // ------------------------------
    function showVariantCard(categoryName) {
        hideAllVariantCards();
        if (variantCards[categoryName]) {
            variantCards[categoryName].style.display = 'block';
        }
    }

    // ------------------------------
    // Hàm load brand
    // ------------------------------
    async function loadBrands() {
        try {
            const response = await fetch('http://localhost:8080/tech-store/api/brands', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
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

    // ------------------------------
    // Hàm hiển thị thông tin sản phẩm
    // ------------------------------
    function fillProductInfo(product) {
        document.getElementById('productName').value = product.productName || '';
        document.getElementById('category').value = product.category?.categoryName || '';
        document.getElementById('warrantyMonths').value = product.warrantyMonths || '0';
        document.getElementById('productStatus').value = product.productStatus || 'ACTIVE';
        if (product.brand?.brandId) {
            document.getElementById('brand').value = product.brand.brandId;
        }

        const imageProduct = document.getElementById('imageProduct');
        imageProduct.innerHTML = '';
        if (product.images) {
            product.images.forEach(img => {

                const wrapper = document.createElement("div");
                wrapper.style.position = "relative";
                wrapper.style.display = "inline-block";
                wrapper.style.margin = "5px";

                const image = document.createElement('img');
                image.src = img.imageUrl;
                image.style.width = '100px';
                image.style.height = '100px';
                image.style.objectFit = 'cover';

                const btnRemove = document.createElement('button');
                btnRemove.textContent = '×';
                btnRemove.style.position = 'absolute';
                btnRemove.style.top = '0';
                btnRemove.style.right = '0';
                btnRemove.style.background = 'red';
                btnRemove.style.color = 'white';
                btnRemove.style.border = 'none';
                btnRemove.style.borderRadius = '50%';
                btnRemove.style.width = '20px';
                btnRemove.style.height = '20px';
                btnRemove.style.cursor = 'pointer';
                btnRemove.style.display = 'flex';
                btnRemove.style.alignItems = 'center';
                btnRemove.style.justifyContent = 'center';
                btnRemove.style.fontSize = '14px';
                btnRemove.style.lineHeight = '1';

                btnRemove.addEventListener("click", function () {
                    wrapper.remove();
                });

                wrapper.appendChild(image);
                wrapper.appendChild(btnRemove);
                imageProduct.appendChild(wrapper);
            });
        }
    }

    // ------------------------------
    // Hàm hiển thị thông tin variant
    // ------------------------------
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


    // ------------------------------
    // Hàm load sản phẩm
    // ------------------------------
    async function loadProduct() {
        await loadBrands();

        const response = await fetch(`http://localhost:8080/tech-store/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Không lấy được thông tin sản phẩm');
        const data = await response.json();
        const product = data.result;

        // Hiện thông tin sản phẩm và ẩn Variant khác
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
              <button class="btn btn-sm btn-primary text-white" onclick="">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-danger text-white" onclick="">
                <i class="bx bx-trash"></i>
              </button>
            </td>
        `;
                variantsTable.appendChild(row);
            });
        }
    }

    // ------------------------------
    // Update ảnh
    // ------------------------------
    let selectedFiles = [];

    const inputImage = document.getElementById("productImageNew");
    const previewContainer = document.getElementById("imageInput");

    // Khi chọn file
    inputImage.addEventListener("change", (event) => {
        const files = Array.from(event.target.files);

        // thêm vào danh sách
        selectedFiles = selectedFiles.concat(files);

        renderPreview();
    });

    // Hàm render preview ảnh
    function renderPreview() {
        previewContainer.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const wrapper = document.createElement("div");
                wrapper.className = "position-relative";

                wrapper.innerHTML = `
                <img src="${e.target.result}" 
                     style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #ddd">

                <button type="button"
                        data-index="${index}"
                        class="btn btn-danger btn-sm position-absolute top-0 end-0">
                    ×
                </button>
            `;

                previewContainer.appendChild(wrapper);
            };

            reader.readAsDataURL(file);
        });
    }

    // Xóa ảnh khỏi danh sách
    previewContainer.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            const index = e.target.getAttribute("data-index");
            selectedFiles.splice(index, 1);
            renderPreview();
        }
    });


    // ------------------------------
    // Update sản phẩm
    // ------------------------------
    async function updateProduct() {

        const productName = document.getElementById("productName").value;
        const warrantyMonths = Number(document.getElementById("warrantyMonths").value);

        if (!productName) {
            const errorDiv = document.getElementById("update-product-error");
            errorDiv.textContent = "Vui lòng nhập tên sản phẩm!";
            errorDiv.classList.remove("d-none");
            return;
        }

        if (warrantyMonths < 0 || warrantyMonths > 60) {
            const errorDiv = document.getElementById("update-product-error");
            errorDiv.textContent = "Bảo hành phải từ 0 đến 60 tháng!";
            errorDiv.classList.remove("d-none");
            return;
        }

        // Lấy ảnh cũ
        const imageObjects = [];
        const images = document.querySelectorAll('#imageProduct img');
        images.forEach(img => {
            imageObjects.push({
                imageUrl: img.src,
                isMain: imageObjects.length === 0
            });
        });
        console.log(imageObjects);

        // Lấy thông tin sản phẩm
        const productId = new URLSearchParams(window.location.search).get("productId");
        const token = localStorage.getItem("token") || "";

        // Nếu có ảnh mới thì upload
        // if (selectedFiles.length > 0) {
        //     for (let i = 0; i < selectedFiles.length; i++) {
        //         const file = selectedFiles[i];
        //         const formData = new FormData();
        //         formData.append("file", file);
        //         try {
        //             const uploadRes = await fetch(
        //                 "http://localhost:8080/tech-store/api/upload/image",
        //                 {
        //                     method: "POST",
        //                     headers: {
        //                         Authorization: "Bearer " + token,
        //                     },
        //                     body: formData,
        //                 }
        //             );

        //             const uploadData = await uploadRes.json();

        //             imageObjects.push({
        //                 imageUrl: uploadData.result,
        //                 isMain: imageObjects.length === 0
        //             });

        //         } catch (err) {
        //             console.error("Upload ảnh lỗi:", err);
        //             alert("Upload ảnh thất bại!");
        //             return;
        //         }
        //     }
        // } 

        const errorDiv = document.getElementById("update-product-error");
        errorDiv.classList.add("d-none");

        if (selectedFiles.length > 0) {
            try {
                const uploadPromises = selectedFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);

                    const uploadRes = await fetch(
                        "http://localhost:8080/tech-store/api/upload/image",
                        {
                            method: "POST",
                            headers: {
                                Authorization: "Bearer " + token,
                            },
                            body: formData,
                        }
                    );

                    const uploadData = await uploadRes.json();

                    return {
                        imageUrl: uploadData.result,
                        isMain: false
                    };
                });

                const newImages = await Promise.all(uploadPromises);

                // Nếu chưa có main → set ảnh đầu tiên làm main
                if (imageObjects.length === 0 && newImages.length > 0) {
                    newImages[0].isMain = true;
                }

                imageObjects.push(...newImages);

            } catch (err) {
                console.error("Upload ảnh lỗi:", err);
                showModal({
                    title: "Thông báo",
                    message: "Upload ảnh thất bại!",
                    type: "danger",
                    autoClose: true,
                    duration: 3000
                });
                return;
            }
        }

        // 🔥 Build payload
        const product = {
            productName: document.getElementById("productName").value,
            brandId: document.getElementById("brand").value,

            // 🔥 convert sang number
            warrantyMonths: Number(document.getElementById("warrantyMonths").value),

            // 🔥 sửa đúng field name
            status: document.getElementById("productStatus").value,

            images: imageObjects,
        };

        try {
            const res = await fetch(
                `http://localhost:8080/tech-store/api/products/${productId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify(product),
                }
            );

            const result = await res.json();

            console.log("Update thành công:", result);
            showModal({
                title: "Thông báo",
                message: "Cập nhật sản phẩm thành công!",
                type: "success",
                autoClose: true,
                duration: 3000
            });
            loadProduct();

        } catch (err) {
            console.error("Lỗi update sản phẩm:", err);
            showModal({
                title: "Thông báo",
                message: "Cập nhật sản phẩm thất bại!",
                type: "danger",
                autoClose: true,
                duration: 3000
            });
        }
    }

    document
        .getElementById("btn-update-product")
        .addEventListener("click", updateProduct);


    // ------------------------------
    // Lấy dữ liệu biến thể
    // ------------------------------
    function extractVariant(card) {
        return {
            productId: new URLSearchParams(window.location.search).get(
                "productId"
            ),
            color: card.querySelector("[id$='-color']")?.value,
            originalPrice: Number(
                card.querySelector("[id$='-originalPrice']")?.value
            ),
            promotionalPrice: Number(
                card.querySelector("[id$='-promotionalPrice']")?.value
            ),
            stock: Number(card.querySelector("[id$='-stock']")?.value),
            isDefault:
                card.querySelector("[id$='-isDefault']")?.value === "true",
            productSpecs: Array.from(
                card.querySelectorAll(".product-spec-infor input")
            ).map((i) => ({
                specKey: i.previousElementSibling?.textContent,
                specValue: i.value,
            })),
        };
    }

    // ------------------------------
    // Lưu biến thể
    // ------------------------------
    document.querySelectorAll(".btn-save-product-variant").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const card = btn.closest(".card");
            const variant = extractVariant(card);

            const res = await fetch(
                "http://localhost:8080/tech-store/api/product-variants",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify(variant),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Save variant failed");
            }

            showModal({
                title: "Thông báo",
                message: "Thêm biến thể thành công!",
                type: "success",
                autoClose: true,
                duration: 3000
            });
            loadProduct();
        });
    });


    // ------------------------------
    // Hiển thị thông tin chi tiết biến thể
    // ------------------------------
    let currentVariantId = null;
    variantsTable.addEventListener('click', function (e) {
        const row = e.target.closest('tr');
        if (!row) return;
        const index = Array.from(row.parentNode.children).indexOf(row);
        const variant = window.productVariants[index];
        if (variant) {
            renderVariantToForm(variant);
        }
    });


    function renderVariantToForm(variant) {
        if (!variant) return;
        const category = document.getElementById("category").value;
        const prefixMap = {
            'Điện thoại': 'phone',
            'Laptop': 'laptop',
            'Chuột': 'mouse',
            'Bàn phím': 'keyboard',
            'Củ sạc': 'charging-adapter',
            'Cáp sạc': 'charging-cable'
        };

        const prefix = prefixMap[category];
        if (!prefix) return;
        const modal = document.getElementById(`${prefix}-modal`);
        modal.classList.add("active");
        const box = modal.querySelector(".variant-modal-box");
        if (box) box.scrollTop = 0;
        currentVariantId = variant.productVariantId;


        // ===== BASIC INFO =====
        document.getElementById(`${prefix}-color-info`).value = variant.color || "";
        document.getElementById(`${prefix}-originalPrice-info`).value = variant.originalPrice || "";
        document.getElementById(`${prefix}-promotionalPrice-info`).value = variant.promotionalPrice || "";
        document.getElementById(`${prefix}-stock-info`).value = variant.stock || "";
        document.getElementById(`${prefix}-isDefault-info`).value = String(variant.isDefault);

        // ===== SPECS =====
        const specMap = {
            // ===== PHONE =====
            "Kích thước màn hình": "screenSize-info",
            "Công nghệ màn hình": "screenTechnology-info",
            "Độ phân giải màn hình": "screenResolution-info",
            "Tần số quét": "refreshRate-info",
            "Kiểu màn hình": "screenType-info",
            "Camera trước": "frontCamera-info",
            "Camera sau": "rearCamera-info",
            "Chip": "chipset-info",
            "GPU": "gpu-info",
            "SIM": "sim-info",
            "RAM": "ram-info",
            "Bộ nhớ": "storage-info",
            "Hệ điều hành": "os-info",
            "CPU": "cpu-info",
            "Cổng sạc": "chargingPort-info",
            "Tính năng đặc biệt": "specialFeatures-info",

            // ===== LAPTOP =====
            "Loại card đồ họa": "gpuType-info",
            "Loại CPU": "cpuType-info",
            "Dung lượng RAM": "ramCapacity-info",
            "Loại RAM": "ramType-info",
            "Ổ cứng": "storage-info",
            "Chất liệu tấm nền": "panelMaterial-info",
            "Chất liệu": "material-info",
            "Bảo mật": "security-info",
            "Webcam": "webcam-info",
            "Wifi": "wifi-info",
            "Bluetooth": "bluetooth-info",

            // ===== MOUSE =====
            "Tương thích": "compatibility-info",
            "Độ phân giải": "resolution-info",
            "Cảm biến": "sensor-info",
            "Nút nhấn": "buttons-info",
            "Kết nối": "connectivity-info",
            "Khoảng cách kết nối": "connectionRange-info",
            "Đèn LED": "led-info",
            "Pin": "battery-info",
            "Kích thước": "dimensions-info",
            "Trọng lượng": "weight-info",
            "Tiện ích": "utilities-info",

            // ===== KEYBOARD =====
            "Loại bàn phím": "keyboardType-info",
            "Số phím": "keyCount-info",
            "Kết nối": "connection-info",
            "Khoảng cách kết nối": "connectionDistance-info",
            "Cổng sạc": "chargingPort-info",

            // ===== CHARGING ADAPTER =====
            "Công suất sạc": "chargingPower-info",
            "Sử dụng tối đa": "maxUsage-info",
            "Đầu ra": "outputPort-info",
            "Nguồn vào": "inputPower-info",
            "Nguồn ra": "outputPower-info",
            "Công nghệ / Đạt chứng nhận": "technology-info",

            // ===== CHARGING CABLE =====
            "Đầu vào": "inputPort-info",
            "Chiều dài dây": "cableLength-info",
            "Chất liệu": "material-info"
        };


        modal.querySelectorAll("input[data-spec-key]").forEach(i => {
            i.value = "";
        });
        // ===== FILL SPECS =====
        (variant.productSpecs || []).forEach(spec => {
            const key = specMap[spec.specKey];

            if (!key) {
                console.warn("Không có mapping cho specKey:", spec.specKey);
                return;
            }

            const el = document.getElementById(`${prefix}-${key}`);

            if (el) {
                el.value = spec.specValue || "";
            } else {
                console.warn("Không tìm thấy element:", `${prefix}-${key}`);
            }
        });
        function handler() {
            modal.classList.remove("active");
        }
        const closeBtn = document.getElementById(`close-${prefix}-modal`);
        closeBtn.addEventListener("click", handler, { once: true });
    }

    // ------------------------------
    // Sửa biến thể
    // ------------------------------
    function buildProductSpecs() {
        const category = document.getElementById("category").value;
        const prefixMap = {
            'Điện thoại': 'phone',
            'Laptop': 'laptop',
            'Chuột': 'mouse',
            'Bàn phím': 'keyboard',
            'Củ sạc': 'charging-adapter',
            'Cáp sạc': 'charging-cable'
        };

        const prefix = prefixMap[category];
        if (!prefix) return [];
        // Ưu tiên modal đang active
        let modal = document.querySelector(".variant-modal-overlay.active");

        // fallback nếu chưa có active
        if (!modal) {
            modal = document.getElementById(`${prefix}-modal`);
        }
        console.log(modal);

        if (!modal) return [];

        const specs = [];
        console.log(JSON.parse(JSON.stringify(specs)));

        modal.querySelectorAll("input[data-spec-key]").forEach(input => {
            const key = input.dataset.specKey; // data-spec-key
            const value = input.value;
            console.log(key, value);
            if (key && value?.trim()) {
                specs.push({
                    specKey: key,
                    specValue: value.trim()
                });
            }
        });
        console.log(specs);

        return specs;
    }

    async function updateVariant(variantId) {
        const category = document.getElementById("category").value;
        const prefixMap = {
            'Điện thoại': 'phone',
            'Laptop': 'laptop',
            'Chuột': 'mouse',
            'Bàn phím': 'keyboard',
            'Củ sạc': 'charging-adapter',
            'Cáp sạc': 'charging-cable'
        };

        const prefix = prefixMap[category];
        if (!prefix) return;
        const request = {
            color: document.getElementById(`${prefix}-color-info`).value,
            originalPrice: parseFloat(document.getElementById(`${prefix}-originalPrice-info`).value),
            promotionalPrice: parseFloat(document.getElementById(`${prefix}-promotionalPrice-info`).value),
            stock: parseInt(document.getElementById(`${prefix}-stock-info`).value),
            isDefault: document.getElementById(`${prefix}-isDefault-info`).value === "true",

            productSpecs: buildProductSpecs()
        };
        console.log(JSON.parse(JSON.stringify(request)));

        const res = await fetch(`http://localhost:8080/tech-store/api/product-variants/${variantId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(request)
        });

        const data = await res.json();

        if (res.ok) {
            showModal({
                title: "Thông báo",
                message: "Update thành công",
                type: "success",
                autoClose: true,
                duration: 3000
            });
            document.getElementById(`${prefix}-modal`).classList.remove("active");
            loadProduct();
        } else {
            showModal({
                title: "Thông báo",
                message: "Update thất bại",
                type: "danger",
                autoClose: true,
                duration: 3000
            });
            console.log(data);
        }
    }

    document.addEventListener("click", function (e) {

        if (e.target.closest(".btn-save-product-variant-info")) {
            const variantId = currentVariantId;
            updateVariant(variantId);
        }
    });

    // Mặc định khi load trang
    loadProduct();
});


