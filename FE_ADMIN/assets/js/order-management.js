document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // ------------------------------
  // Biến
  // ------------------------------
  const orderStatusSelect = document.querySelector("#filter-order-status");
  const paymentStatusSelect = document.querySelector("#filter-payment-status");
  const paymentMethodSelect = document.querySelector("#filter-payment-method");
  const searchInput = document.querySelector("#search-order");
  const fromDate = document.querySelector("#filter-from-date");
  const toDate = document.querySelector("#filter-to-date");
  const pageSizeSelect = document.querySelector("#page-size");
  const tbody = document.querySelector("#orders-table tbody");
  let pageNumber = 0;
  let orders = []; // lưu danh sách order hiện tại
  const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"];

  function toDateTime(dateStr, isEndOfDay = false) {
    if (!dateStr) return null;

    return isEndOfDay
      ? `${dateStr}T23:59:59`
      : `${dateStr}T00:00:00`;
  }

  const orderStatuses = [
    { value: "PENDING", label: "Đang xử lý", color: "#f39c12" },
    { value: "CONFIRMED", label: "Đã xác nhận", color: "#3498db" },
    { value: "SHIPPED", label: "Đã vận chuyển", color: "#8e44ad" },
    { value: "CANCELLED", label: "Đã hủy", color: "#e74c3c" },
    { value: "COMPLETED", label: "Đã hoàn thành", color: "#2ecc71" },
  ];

  const orderTransitionMap = {
    PENDING: ["PENDING", "CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CONFIRMED", "SHIPPED", "CANCELLED"],
    SHIPPED: ["SHIPPED", "COMPLETED", "CANCELLED"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"],
  };

  // ------------------------------
  // Hiển thị thống kê
  // ------------------------------
  function renderStatusBars(data) {
    console.log(data);

    const orderStatusCount = {
      PENDING: data.pending || 0,
      CONFIRMED: data.confirmed || 0,
      SHIPPED: data.shipping || 0,
      COMPLETED: data.completed || 0,
      CANCELLED: data.cancelled || 0,
    };

    const total = statuses.reduce((sum, status) => {
      return sum + orderStatusCount[status];
    }, 0);

    statuses.forEach((status) => {
      const count = orderStatusCount[status];

      const countEl = document.getElementById(`count-${status}`);
      if (countEl) countEl.textContent = count;

      const percent = total > 0 ? (count / total) * 100 : 0;

      const barEl = document.getElementById(`bar-${status}`);
      if (barEl) barEl.style.width = percent + "%";
    });
  }

  // ------------------------------
  // Set màu cho select order
  // ------------------------------
  function setOrderSelectColor(select) {
    const status = orderStatuses.find(s => s.value === select.value);
    if (!status) return;

    select.style.backgroundColor = status.color;
    select.style.color = "#fff";
    select.style.border = "none";
    select.style.width = "125px";
  }

  // ------------------------------
  // Set màu cho select payment
  // ------------------------------
  const paymentStatuses = [
    { value: "PENDING", label: "Đang xử lý", color: "#f39c12" },
    { value: "PAID", label: "Đã thanh toán", color: "#2ecc71" },
  ];

  const paymentTransitionMap = {
    PENDING: ["PENDING", "PAID"],
    PAID: ["PAID"],
  };

  function setPaymentSelectColor(select) {
    const status = paymentStatuses.find(s => s.value === select.value);
    if (!status) return;

    select.style.backgroundColor = status.color;
    select.style.color = "#fff";
    select.style.border = "none";
    select.style.width = "125px";
  }

  function renderOrderStatusLabel(status) {
    const found = orderStatuses.find((s) => s.value === status);
    return found ? found.label : status;
  }

  function renderPaymentStatusLabel(status) {
    const found = paymentStatuses.find((s) => s.value === status);
    return found ? found.label : status;
  }


  // ------------------------------
  // Load thống kê
  // ------------------------------
  async function loadOrderStatistics() {
    const res = await fetch("http://localhost:8080/tech-store/api/orders/statistics", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    renderStatusBars(data.result);
  }


  // ------------------------------
  // Load đơn hàng
  // ------------------------------
  window.loadOrders = async function () {
    try {
      let url = `http://localhost:8080/tech-store/api/orders/search`;

      const params = [];
      if (pageNumber > 0) params.push(`page=${pageNumber}`);
      if (pageSizeSelect.value) params.push(`size=${pageSizeSelect.value}`);
      if (orderStatusSelect.value)
        params.push(`orderStatus=${orderStatusSelect.value}`);
      if (paymentStatusSelect.value)
        params.push(`paymentStatus=${paymentStatusSelect.value}`);
      if (paymentMethodSelect.value)
        params.push(`paymentMethod=${paymentMethodSelect.value}`);

      if (searchInput.value) {
        params.push(`orderCode=${searchInput.value}`);
        params.push(`recipientName=${searchInput.value}`);
        params.push(`recipientPhone=${searchInput.value}`);
      }

      if (fromDate.value)
        params.push(`fromDate=${toDateTime(fromDate.value, false)}`);
      if (toDate.value)
        params.push(`toDate=${toDateTime(toDate.value, true)}`);

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }

      if (!res.ok) throw new Error("Lỗi API");

      const data = await res.json();
      const tbody = document.querySelector("#orders-table tbody");
      tbody.innerHTML = "";

      orders = data.result.content || [];

      if (!orders.length) {
        tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">Chưa có đơn hàng</td>
        </tr>
      `;
        renderPagination(data.result.totalPages, data.result.pageable.pageNumber);
        return;
      }

      orders.forEach((order) => {
        // Tự động hủy đơn hàng nếu thanh toán qua ngân hàng nhưng chưa thanh toán
        if (order.payment.paymentMethod === "BANK" && order.payment.paymentStatus === "PENDING"
          && order.orderStatus !== "CANCELLED") {
          fetch(
            `http://localhost:8080/tech-store/api/orders/${order.orderId}?orderStatus=CANCELLED`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          loadOrders();
          return;
        }

        // Tự động hoàn thành đơn hàng nếu thanh toán khi nhận hàng và đã giao hàng
        if (order.payment.paymentMethod === "CASH" && order.payment.paymentStatus === "PAID"
          && order.orderStatus !== "COMPLETED") {
          fetch(
            `http://localhost:8080/tech-store/api/orders/${order.orderId}?orderStatus=COMPLETED`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          loadOrders();
          return;
        }

        // Lấy danh sách trạng thái đơn hàng cho phép
        const allowedStatuses = orderTransitionMap[order.orderStatus] || [];
        const orderStatusOptions = orderStatuses
          .filter(s => allowedStatuses.includes(s.value))
          .map(
            (s) =>
              `<option value="${s.value}" ${s.value === order.orderStatus ? "selected" : ""
              }>${s.label}</option>`
          )
          .join("");

        // Lấy danh sách trạng thái thanh toán cho phép
        const allowedPaymentStatuses = paymentTransitionMap[order.payment.paymentStatus] || [];
        const paymentStatusOptions = paymentStatuses
          .filter(s => allowedPaymentStatuses.includes(s.value))
          .map(
            (s) =>
              `<option value="${s.value}" ${s.value === order.payment.paymentStatus ? "selected" : ""
              }>${s.label}</option>`
          )
          .join("");

        const tr = document.createElement("tr");
        tr.dataset.orderId = order.orderId;
        tr.dataset.paymentId = order.payment.paymentId;

        tr.innerHTML = `
        <td class="align-middle p-3">${order.orderCode}</td>
        <td class="align-middle">${new Date(
          order.createdAt
        ).toLocaleString()}</td>
        <td class="align-middle">${order.totalAmount.toLocaleString(
          "vi-VN"
        )}đ</td>
        <td class="align-middle">${order.recipientName}</td>
        <td class="align-middle">${order.recipientPhone}</td>
        <td class="align-middle">
          ${order.payment.paymentMethod === "CASH"
            ? "TT khi nhận hàng"
            : "Chuyển khoản NH"
          }
        </td>
        <td class="align-middle">
          <select class="payment-status-select">
            ${paymentStatusOptions}
          </select>
        </td>
        <td class="align-middle">
          <select class="order-status-select">
            ${orderStatusOptions}
          </select>
        </td>
        <td class="align-middle text-center">
          <button class="btn btn-outline-primary btn-sm view-detail-btn">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      `;

        tbody.appendChild(tr);

        setOrderSelectColor(tr.querySelector(".order-status-select"));
        setPaymentSelectColor(tr.querySelector(".payment-status-select"));
      });

      renderPagination(
        data.result.totalPages,
        data.result.pageable.pageNumber
      );
    } catch (err) {
      console.error(err);

      tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">Không thể tải dữ liệu</td>
      </tr>
    `;
    }
  };


  // ------------------------------
  // Build phân trang
  // ------------------------------
  function buildPagination(totalPages, currentPage = 1) {
    const last = totalPages;

    const rawPages = [
      1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      last
    ];

    // 1. lọc số hợp lệ + unique
    const pages = [...new Set(rawPages)]
      .filter(p => p >= 1 && p <= last)
      .sort((a, b) => a - b);

    // 2. chèn "..."
    const result = [];

    for (let i = 0; i < pages.length; i++) {
      const current = pages[i];
      const prev = pages[i - 1];

      if (i > 0) {
        // nếu khoảng cách > 1 thì thêm "..."
        if (current - prev > 1) {
          result.push("...");
        }
      }

      result.push(current);
    }

    return result;
  }

  function renderPagination(totalPages, currentPage0) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    pageNumber = currentPage0 + 1; // convert sang 1-based cho UI

    const pages = buildPagination(totalPages, pageNumber);

    pages.forEach(p => {
      const li = document.createElement("li");

      if (p === "...") {
        const span = document.createElement("span");
        span.textContent = "...";
        span.classList.add("dots");
        li.appendChild(span);
      } else {
        const btn = document.createElement("button");
        btn.textContent = p;
        btn.dataset.page = p;

        if (p === pageNumber) btn.classList.add("active");

        btn.onclick = () => {
          pageNumber = p - 1; // quay về 0-based
          loadOrders();

          document.getElementById("action-bar")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        };

        li.appendChild(btn);
      }

      container.appendChild(li);
    });
  }

  // ------------------------------
  // Xem chi tiết đơn hàng
  // ------------------------------
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-detail-btn");
    if (!btn) return;

    const tr = btn.closest("tr");
    const orderId = tr.dataset.orderId;
    const order = orders.find((o) => o.orderId == orderId);
    if (order) showOrderDetail(order);
  });

  function showOrderDetail(order) {
    const content = document.querySelector("#order-detail-content");
    content.innerHTML = `
      <div class="grid grid-cols-2 gap-4">

  <!-- LEFT: THÔNG TIN ĐƠN -->
  <div class="bg-white p-4 rounded-2xl shadow">
    <h2 class="font-semibold mb-2">📦 Thông tin đơn hàng</h2>

    <p class="text-left"><span class="fw-semibold">Mã đơn hàng:</span> ${order.orderCode}</p>
    <p class="text-left"><span class="fw-semibold">Thời gian đặt:</span> ${new Date(order.createdAt).toLocaleString()}</p>
    <p class="text-left">
      <span class="fw-semibold">Trạng thái đơn hàng:</span>
      ${renderOrderStatusLabel(order.orderStatus)}
    </p>
    <p class="text-left">
      <span class="fw-semibold">Trạng thái thanh toán:</span>
      ${renderPaymentStatusLabel(order.payment.paymentStatus)}
      ${order.payment.paidAt
        ? "(" + new Date(order.payment.paidAt).toLocaleString() + ")"
        : ""}
    </p>
  </div>

  <!-- RIGHT: NGƯỜI NHẬN -->
  <div class="bg-white p-4 rounded-2xl shadow">
    <h2 class="font-semibold mb-2">👤 Người nhận</h2>

    <p class="text-left"><span class="fw-semibold">Tên:</span> ${order.recipientName}</p>
    <p class="text-left"><span class="fw-semibold">SĐT:</span> ${order.recipientPhone}</p>
    <p class="text-left">
      <span class="fw-semibold">Địa chỉ:</span>
      ${order.detailAddress}, ${order.ward}, ${order.city}
    </p>
    <p class="text-left"><span class="fw-semibold">Ghi chú:</span> ${order.note || "Không"}</p>
  </div>

  <!-- FULL WIDTH: THANH TOÁN -->
  <div class="col-span-2 bg-white p-4 rounded-2xl shadow">
    <h2 class="font-semibold mb-2">💰 Thanh toán</h2>

    <div class="space-y-2">

      <div class="flex justify-between">
        <span>Tổng tiền sản phẩm</span>
        <span>${order.subtotal.toLocaleString("vi-VN")}đ</span>
      </div>

      <div class="flex justify-between">
        <span>Phí vận chuyển</span>
        <span>${order.shippingFee.toLocaleString("vi-VN")}đ</span>
      </div>

      <div class="flex justify-between text-red-500">
        <span>Giảm giá</span>
        <span>-${order.discountAmount.toLocaleString("vi-VN")}đ</span>
      </div>

      <hr>

      <div class="flex justify-between font-bold text-lg">
        <span>Tổng tiền</span>
        <span class="text-green-600">
          ${order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

    </div>
  </div>

</div>

</div>

      <p class="text-left fw-semibold p-3">Sản phẩm:</p>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>Sản phẩm</th>
            <th>Màu</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${order.orderItems
        .map(
          (item) => `
                <tr>
                  <td class="align-middle"><img src="${item.productImageUrl}" width="50"></td>
                  <td class="align-middle text-start" style="max-width: 300px; white-space: normal;">${item.productName}</td>
                  <td class="align-middle">${item.color}</td>
                  <td class="align-middle text-center">${item.quantity}</td>
                  <td class="align-middle">${item.price.toLocaleString("vi-VN")}đ</td>
                  <td class="align-middle">${item.subTotal.toLocaleString("vi-VN")}đ</td>
                </tr>
              `
        )
        .join("")}
        </tbody>
      </table>
    `;
    new bootstrap.Modal(document.getElementById("orderDetailModal")).show();
  }

  // ------------------------------
  // Cập nhật trạng thái thanh toán & đơn hàng
  // ------------------------------
  tbody.addEventListener("change", async (e) => {
    const selectPayment = e.target.closest(".payment-status-select");
    const selectOrder = e.target.closest(".order-status-select");

    // Thanh toán
    if (selectPayment) {
      const tr = selectPayment.closest("tr");

      //Không thể thay đổi trạng thái thanh toán cho Chuyển khoản NH
      const paymentMethodCheck = tr.cells[5].textContent.trim();
      if (paymentMethodCheck === "Chuyển khoản NH") {
        showModal({
          title: "Thông báo",
          message: "Không thể cập nhật trạng thái thanh toán cho hình thức thanh toán 'Chuyển khoản ngân hàng'",
          type: "danger",
          autoClose: true,
          duration: 3000
        });
        pageNumber--;
        loadOrders();
        return;
      }

      //Không thể thay đổi trạng thái Đã thanh toán
      const select = tr.cells[6].querySelector(".payment-status-select");
      const paymentStatusCheck = select.value;

      if (paymentStatusCheck === "PENDING") {
        showModal({
          title: "Thông báo",
          message: "Không thể thay đổi trạng thái 'Đã thanh toán'",
          type: "danger",
          autoClose: true,
          duration: 3000
        });
        pageNumber--;
        loadOrders();
        return;
      }

      const paymentId = tr.dataset.paymentId;
      const newStatus = selectPayment.value;
      setPaymentSelectColor(selectPayment);

      try {
        const res = await fetch(
          `http://localhost:8080/tech-store/api/payments/${paymentId}?paymentStatus=${newStatus}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Cập nhật trạng thái thanh toán thất bại");
        const data = await res.json();
        showModal({
          title: "Thông báo",
          message: "Cập nhật trạng thái thanh toán thành công!",
          type: "success",
          autoClose: true,
          duration: 3000
        });
        pageNumber--;
        loadOrders();
      } catch (err) {
        console.error(err);
        alert("Không thể cập nhật trạng thái thanh toán!");
      }
    }

    // Đơn hàng
    if (selectOrder) {
      const tr = selectOrder.closest("tr");
      const orderId = tr.dataset.orderId;
      const newStatus = selectOrder.value;
      setOrderSelectColor(selectOrder);
      try {
        const res = await fetch(
          `http://localhost:8080/tech-store/api/orders/${orderId}?orderStatus=${newStatus}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Cập nhật trạng thái đơn hàng thất bại");
        showModal({
          title: "Thành công",
          message: "Cập nhật trạng thái đơn hàng thành công!",
          type: "success",
          autoClose: true,
          duration: 3000,
        });
        loadOrderStatistics()
      } catch (err) {
        console.error(err);
        showModal({
          title: "Lỗi",
          message: "Không thể cập nhật trạng thái đơn hàng!",
          type: "danger",
          autoClose: true,
          duration: 3000,
        });
      }
    }
  });

  // ------------------------------
  // Filter trạng thái đơn hàng
  // ------------------------------
  orderStatusSelect.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });

  paymentStatusSelect.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });

  paymentMethodSelect.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });

  searchInput.addEventListener("input", () => {
    pageNumber = 0;
    loadOrders();
  });

  fromDate.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });

  toDate.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });

  pageSizeSelect.addEventListener("change", () => {
    pageNumber = 0;
    loadOrders();
  });



  // ------------------------------
  // Load dữ liệu mặc định khi mở trang
  // ------------------------------
  await loadOrderStatistics();
  await loadOrders();
});
