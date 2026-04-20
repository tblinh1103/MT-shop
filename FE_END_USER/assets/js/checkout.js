document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  let cartTotal = 0; // Tổng tiền hiện tại (cập nhật sau giảm giá)
  let cartItems = []; // Chi tiết giỏ hàng
  let appliedDiscountCode = null;
  let originalTotal = 0;
  let discountAmount = 0;
  let shippingFee = 0;

  // -----------------------
  // Lấy giỏ hàng
  // -----------------------
  async function fetchCart() {
    try {
      const response = await fetch("http://localhost:8080/tech-store/api/carts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    } catch (error) {
      console.error("Lỗi fetchCart:", error);
      return null;
    }
  }

  async function renderCart() {
    const result = await fetchCart();
    if (!result || result.code !== 1000) return;

    const cart = result.result;
    cartTotal = cart.total; // khởi tạo tổng tiền
    originalTotal = cart.total;
    cartItems = cart.cartItems;

    const container = document.querySelector(".order-items");
    if (!container) return;

    container.innerHTML = "";
    let itemCount = 0;

    cart.cartItems.forEach((cartItem) => {
      const html = `
        <div class="order-item" data-id="${cartItem.cartItemId}">
          <span class="d-none">${cartItem.productVariantId}</span>
          <div class="order-item-image">
            <img src="${cartItem.productImageUrl}" alt="${cartItem.productName}" class="img-fluid">
          </div>
          <div class="order-item-details">
            <h4>${cartItem.productName}</h4>
            <p class="order-item-variant">Màu: ${cartItem.color}</p>
            <div class="order-item-price">
              <span class="quantity">${cartItem.quantity} ×</span>
              <span class="price">${cartItem.promotionalPrice.toLocaleString()}đ</span>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
      itemCount += cartItem.quantity;
    });

    updateCartTotalUI();
  }

  // -----------------------
  // Lấy địa chỉ mặc định
  // -----------------------
  async function fetchDefaultAddress() {
    try {
      const response = await fetch("http://localhost:8080/tech-store/api/addresses/default", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const result = await response.json();
      if (result.code === 1000 && result.result) return result.result;
      return null;
    } catch (error) {
      console.error("Lỗi fetchDefaultAddress:", error);
      return null;
    }

  }

  function fillAddressForm(address) {
    if (!address) return;

    const fields = {
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      city: address.city,
      district: address.district,
      ward: address.ward,
      detailAddress: address.detailAddress
    };

    Object.keys(fields).forEach(id => {
      const el = document.querySelector("#" + id);
      if (el) {
        el.value = fields[id] || "";
      }
    });

    if (address.city) {
      updateShippingFee(address.city);
      updateCartTotalUI();
    }
  }

  const cityInput = document.querySelector("#city");

  cityInput.addEventListener("change", () => {
    updateShippingFee(cityInput.value);
    updateCartTotalUI();
  });

  function updateShippingFee(city) {
    // Demo: điện thoại/laptop
    if (!city) {
      shippingFee = 0;
      return;
    }

    // Có thể map tĩnh một số tỉnh để minh họa
    const shippingRates = {
      "Hà Nội": 20000,
      "Hồ Chí Minh": 25000,
      "Đà Nẵng": 22000
    };

    shippingFee = shippingRates[city] || 30000; // mặc định 30k
  }

  function updateCartTotalUI() {
    // cartTotal = subtotal + shippingFee - discountAmount
    let totalPrice = originalTotal + shippingFee - discountAmount;

    if (totalPrice < 0) totalPrice = 0;
    cartTotal = totalPrice;

    const totalProductEl = document.querySelector(".total-product");
    const totalCartEl = document.querySelector(".total-cart");
    const shippingFeeEl = document.querySelector(".shipping-fee");
    const totalDiscountEl = document.querySelector(".total-discount");

    if (totalProductEl) totalProductEl.textContent = originalTotal.toLocaleString() + "đ";
    if (totalCartEl) totalCartEl.textContent = totalPrice.toLocaleString() + "đ";
    if (shippingFeeEl) shippingFeeEl.textContent = shippingFee ? shippingFee.toLocaleString() + "đ" : "Miễn phí";
    if (totalDiscountEl) totalDiscountEl.textContent = discountAmount ? "- " + discountAmount.toLocaleString() + "đ" : "0đ";

    // Cập nhật nút đặt hàng
    const btnPriceEl = document.querySelector(".btn-price");
    if (btnPriceEl) btnPriceEl.textContent = totalPrice.toLocaleString() + "đ";
  }

  const applyBtn = document.querySelector(".apply-discount-btn");

  applyBtn?.addEventListener("click", async () => {
    const code = document.querySelector(".discount-input")?.value.trim();

    if (!code) {
      showModal({
        title: "Cảnh báo",
        message: `Vui lòng nhập mã giảm giá!`,
        type: "warning",
        autoClose: true
      });
      return;
    }

    // Nếu đổi mã khác → reset
    if (appliedDiscountCode && appliedDiscountCode !== code) {
      appliedDiscountCode = null;
      discountAmount = 0;

      updateCartTotalUI();
    }

    try {
      if (applyBtn.disabled) return;
      applyBtn.disabled = true;
      const response = await fetch("http://localhost:8080/tech-store/api/discounts/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discountCode: code,
          cartTotal: originalTotal // 🔥 luôn dùng giá gốc
        })
      });

      const result = await response.json();

      if (result.code !== 1000) {
        appliedDiscountCode = null;
        discountAmount = 0;
        updateCartTotalUI();

        showModal({
          title: "Cảnh báo",
          message: `Mã giảm giá không hợp lệ!`,
          type: "warning",
          autoClose: true
        });
        return;
      }

      const data = result.result;

      appliedDiscountCode = code;
      discountAmount = data.discountAmount;
      updateCartTotalUI();

      showModal({
        title: "Thành công",
        message: `Đã áp mã "${code}"`,
        type: "success",
        autoClose: true
      });

    } catch (error) {
      showModal({
        title: "Lỗi",
        message: `Có lỗi xảy ra khi áp mã!`,
        type: "danger",
        autoClose: true
      });
    } finally {
      applyBtn.disabled = false;
    }
  });

  // -----------------------
  // Submit đơn hàng
  // -----------------------
  document.querySelector(".place-order-btn")?.addEventListener("click", async () => {
    const recipientName = document.querySelector("#recipientName")?.value.trim();
    const recipientPhone = document.querySelector("#recipientPhone")?.value.trim();
    const city = document.querySelector("#city")?.value.trim();
    const district = "";
    const ward = document.querySelector("#ward")?.value.trim();
    const detailAddress = document.querySelector("#detailAddress")?.value.trim();
    const note = document.querySelector("#note")?.value.trim() || "";

    if (!recipientName || !recipientPhone || !city || !detailAddress) {
      showModal({
        title: "Lỗi",
        message: `Vui lòng điền đầy đủ thông tin người nhận và địa chỉ!`,
        type: "error",
        autoClose: false
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }

    const selectedPayment = document.querySelector('input[name="payment-method"]:checked')?.id;
    let paymentMethod = "";

    if (selectedPayment === "bank-transfer") {
      paymentMethod = "BANK";
    } else if (selectedPayment === "cod") {
      paymentMethod = "CASH";
    } else {
      showModal({
        title: "Cảnh báo",
        message: `Vui lòng chọn phương thức thanh toán!`,
        type: "warning",
        autoClose: true
      });
      return;
    }

    const isAccepted = document.getElementById("terms").checked;

    if (!isAccepted) {
      showModal({
        title: "Cảnh báo",
        message: `Vui lòng đồng ý với 
                  <a href="#" data-bs-toggle="modal" data-bs-target="#termsModal"><strong>Điều khoản</strong></a> 
                  và 
                  <a href="#" data-bs-toggle="modal" data-bs-target="#privacyModal"><strong>Chính sách bảo mật</strong></a>!`,
        type: "warning",
        autoClose: false
      });
      return;
    }

    const orderPayload = {
      subtotal: originalTotal,
      shippingFee: shippingFee,
      discountAmount: discountAmount,
      totalAmount: cartTotal, // luôn dùng tổng tiền cuối cùng
      note: note,
      recipientName,
      recipientPhone,
      city,
      district,
      ward,
      detailAddress,
      orderItems: cartItems.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.promotionalPrice,
      })),
      paymentMethod: paymentMethod,
      discountCode: appliedDiscountCode
    };

    console.log("Payload đặt hàng:", orderPayload);

    try {
      const response = await fetch("http://localhost:8080/tech-store/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();
      console.log("Tạo đơn hàng response:", result);

      if (result.code !== 1000) {
        showModal({
          title: "Thông báo",
          message: `Tạo đơn hàng thất bại!`,
          type: "danger",
          autoClose: false
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      const order = result.result;

      // =========================
      // 🟢 COD → đi luôn
      // =========================
      if (paymentMethod === "CASH") {
        window.location.href = `order-confirmation.html?orderId=${order.orderId}`;
        return;
      }

      // =========================
      // 🔵 BANK → gọi VNPAY
      // =========================
      if (paymentMethod === "BANK") {

        // 🔥 gọi API lấy link VNPAY
        const vnpayRes = await fetch(
          `http://localhost:8080/tech-store/api/payments/${order.payment.paymentId}/vnpay`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }
        );

        const vnpayResult = await vnpayRes.json();

        if (vnpayResult.code !== 1000) {
          showModal({
            title: "Lỗi",
            message: `Không tạo được link thanh toán!`,
            type: "danger",
            autoClose: true
          });
          return;
        }

        // 🔥 redirect sang VNPAY
        window.location.href = vnpayResult.result;
      }

    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      showModal({
        title: "Thông báo",
        message: `Có lỗi xảy ra khi tạo đơn hàng!`,
        type: "danger",
        autoClose: false
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  });

  document.getElementById("btn-change-address")
    .addEventListener("click", async function (e) {
      e.preventDefault(); // quan trọng nếu là button trong form hoặc thẻ a
      await loadAddresses()
      toggleAddressList();
    });

  function toggleAddressList() {
    const list = document.getElementById("addressListContainer");
    list.classList.toggle("d-none");
  }

  // ================== LOAD DANH SÁCH ĐỊA CHỈ ==================
  async function loadAddresses() {
    try {
      const response = await fetch("http://localhost:8080/tech-store/api/addresses", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.code !== 1000) throw new Error(data.message);

      const addressesGrid = document.querySelector(".addresses-grid");
      addressesGrid.innerHTML = `
        <div style="text-align: left;">
          <span style="font-size:20px;">Danh sách địa chỉ</span>
        </div>
        <div style="text-align: right;">
          <button id="close-address-list" style="border:none;background:none;font-size:20px;">&times;</button>
        </div>
      `;

      const addresses = data.result.sort((a, b) => b.isDefault - a.isDefault);

      addresses.forEach((addr) => {
        const card = document.createElement("div");
        card.className = `address-card ${addr.isDefault ? "default" : ""}`;
        card.dataset.aos = "fade-up";

        const addressTypeMap = {
          HOME: "Nhà",
          OFFICE: "Văn phòng",
          STORE: "Cửa hàng",
          OTHER: "Khác",
        };

        card.innerHTML = `
          <div class="card-header">
            <h4 class="address-type">${addressTypeMap[addr.addressType] || "Khác"}</h4>
            ${addr.isDefault ? `<span class="default-badge">Mặc định</span>` : ""}
          </div>
          <div class="card-body">
            <p class="address-text">Tỉnh/Thành phố: ${addr.city}<br>Phường/Xã: ${addr.ward}<br>Chi tiết: ${addr.detailAddress || ""}</p>
            <div class="contact-info">
              <div><i class="bi bi-person"></i> ${addr.recipientName}</div>
              <div><i class="bi bi-telephone"></i> ${addr.recipientPhone}</div>
            </div>
          </div>
        `;

        // ✅ CLICK TOÀN CARD
        card.addEventListener("click", () => {
          const selectedAddress = {
            recipientName: addr.recipientName,
            recipientPhone: addr.recipientPhone,
            city: addr.city,
            district: addr.district,
            ward: addr.ward,
            detailAddress: addr.detailAddress,
          };

          fillAddressForm(selectedAddress);

          // đóng popup
          closeAddressList();
        });



        addressesGrid.appendChild(card);
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách địa chỉ:", error);
      showModal({
        title: "Lỗi",
        message: `Không thể tải danh sách địa chỉ!`,
        type: "danger",
        autoClose: true
      });
    }
  }

  document.querySelector(".addresses-grid").addEventListener("click", function (e) {
    if (e.target.id === "close-address-list") {
      closeAddressList();
    }
  });

  function closeAddressList() {
    document.getElementById("addressListContainer").classList.add("d-none");
  }

  document.getElementById("addressListContainer").addEventListener("click", function (e) {
    if (e.target === this) {
      closeAddressList();
    }
  });

  function selectAddress(addr) {
    const address = {
      recipientName: addr.recipientName,
      recipientPhone: addr.recipientPhone,
      city: addr.city,
      district: addr.district,
      ward: addr.ward,
      detailAddress: addr.detailAddress
    };

    console.log("Selected address:", address);


    // đóng popup nếu cần
    closeAddressList();
  }

  // -----------------------
  // Thực hiện khi load
  // -----------------------
  await renderCart(); // phải load cart trước

  const defaultAddress = await fetchDefaultAddress();
  fillAddressForm(defaultAddress);

  updateCartTotalUI();
});
