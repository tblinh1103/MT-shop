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

    const totalCartEl = document.querySelector(".total-cart");
    if (totalCartEl) totalCartEl.textContent = cart.total.toLocaleString() + "đ";

    const totalProductEl = document.querySelector(".total-product");
    if (totalProductEl) totalProductEl.textContent = cart.total.toLocaleString() + "đ";

    const itemCountEl = document.querySelector(".item-count");
    if (itemCountEl) itemCountEl.textContent = itemCount + " sản phẩm";

    document.querySelector(".btn-price").textContent = cart.total.toLocaleString() + "đ";
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
  }

  // -----------------------
  // Áp mã giảm giá
  // -----------------------
  /*
  document.querySelector(".apply-discount-btn")?.addEventListener("click", async () => {
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

    try {
      const response = await fetch("http://localhost:8080/tech-store/api/discounts/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discountCode: code,
          cartTotal: cartTotal
        })
      });
      const result = await response.json();
      console.log("Áp mã response:", result);

      if (result.code !== 1000) {
        showModal({
          title: "Cảnh báo",
          message: `Mã giảm giá không hợp lệ!`,
          type: "warning",
          autoClose: true
        });
        return;
      }

      appliedDiscountCode = code;

      const data = result.result;

      // Hiển thị giảm giá và tổng tiền mới
      const discountEl = document.querySelector(".total-discount");
      if (discountEl) discountEl.textContent = "- " + data.discountAmount.toLocaleString() + "đ";

      const totalEl = document.querySelector(".total-cart");
      if (totalEl) totalEl.textContent = data.finalAmount.toLocaleString() + "đ";

      document.querySelector(".btn-price").textContent = data.finalAmount.toLocaleString() + "đ";

      // **Cập nhật cartTotal bằng tổng tiền sau giảm**
      cartTotal = data.finalAmount;

      showModal({
        title: "Thành công",
        message: `Áp mã giảm giá thành công!`,
        type: "success",
        autoClose: true
      });

    } catch (error) {
      console.error(error);
      showModal({
        title: "Lỗi",
        message: `Có lỗi xảy ra khi áp mã!`,
        type: "danger",
        autoClose: true
      });
    }
  });
  */

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
      cartTotal = originalTotal;
      alert(originalTotal + " " + cartTotal);
      document.querySelector(".total-discount").textContent = "0đ";
      document.querySelector(".total-cart").textContent =
        originalTotal.toLocaleString() + "đ";
    }

    try {
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
      cartTotal = data.finalAmount;

      document.querySelector(".total-discount").textContent =
        "- " + data.discountAmount.toLocaleString() + "đ";

      document.querySelector(".total-cart").textContent =
        data.finalAmount.toLocaleString() + "đ";

      document.querySelector(".btn-price").textContent =
        data.finalAmount.toLocaleString() + "đ";

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
      showModal({
        title: "Tạo đơn hàng thành công",
        message: `Mã đơn hàng: ${order.orderCode}<br>
                  Tổng tiền: ${order.totalAmount.toLocaleString()}VND`,
        type: "success",
        autoClose: false
      });
      document.getElementById("successModal-btn").onclick = () => {
        window.location.href = `order-confirmation.html?orderId=${order.orderId}`;
      };

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

  // -----------------------
  // Thực hiện khi load
  // -----------------------
  const defaultAddress = await fetchDefaultAddress();
  fillAddressForm(defaultAddress);
  await renderCart();
});
