document.addEventListener("DOMContentLoaded", function () {
  const userKeyword = document.getElementById("filter-user-keyword");
  const userStatus = document.getElementById("filter-user-status");

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  }

  let customerTable = null;
  const tbody = document.querySelector("#customers-table tbody");

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  }


  // ============================================
  //  LOAD KHÁCH HÀNG
  // ============================================
  function loadCustomers() {
    const params = [];
    if (userKeyword.value) params.push(`keyword=${userKeyword.value}`);
    if (userStatus.value) params.push(`status=${userStatus.value}`);
    let url = "http://localhost:8080/tech-store/api/users/search";
    if (params.length > 0) url += "?" + params.join("&");
    fetch(url, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        const customers = data.result;
        tbody.innerHTML = "";

        customers.forEach((user) => {
          const gender =
            user.gender === "MALE"
              ? "Nam"
              : user.gender === "FEMALE"
                ? "Nữ"
                : "Khác";
          const status = user.userStatus === "ACTIVE" ? "Hoạt động" : "Khóa";

          const tr = document.createElement("tr");
          tr.dataset.userId = user.userId;
          tr.dataset.username = user.username;
          tr.dataset.firstname = user.firstname;
          tr.dataset.lastname = user.lastname;
          tr.dataset.gender = gender;
          tr.dataset.dob = formatDate(user.dateOfBirth);
          tr.dataset.email = user.email;
          tr.dataset.phone = user.phoneNumber;
          tr.dataset.status = user.userStatus;
          tr.innerHTML = `
              <td class="align-middle p-3">${user.username}</td>
              <td class="align-middle">${user.firstname}</td>
              <td class="align-middle">${user.lastname}</td>
              <td class="align-middle">${gender}</td>
              <td class="align-middle">${formatDate(user.dateOfBirth)}</td>
              <td class="align-middle">${user.email}</td>
              <td class="align-middle">${user.phoneNumber}</td>
              <td class="status align-middle">${status}</td>
              <td class="align-middle">
                <button class="btn btn-sm btn-warning text-white toggle-status">
                  <i class="bx ${user.userStatus === "ACTIVE" ? "bxs-lock" : "bxs-lock-open"}"></i>
                </button>
                <button class="btn btn-sm btn-primary text-white" onclick="showInfo('${user.userId}')">
                  <i class="bi bi-pencil-square"></i>
                </button>
              </td>
            `;
          tbody.appendChild(tr);
        });

        attachToggleEvents();
      })
      .catch((err) => console.error("Error loading customers:", err));
  }

  // ============================================
  //  GẮN SỰ KIỆN TOGGLE LOCK/UNLOCK
  // ============================================
  function attachToggleEvents() {
    document.querySelectorAll(".toggle-status").forEach((button) => {
      button.addEventListener("click", function () {
        const tr = this.closest("tr");
        const userId = tr.dataset.userId;
        fetch(
          `http://localhost:8080/tech-store/api/users/customers/${userId}/status`,
          {
            method: "PUT",
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "application/json",
            },
          }
        )
          .then((res) => res.json())
          .then((result) => {
            const user = result.result;

            tr.querySelector(".status").textContent =
              user.userStatus === "ACTIVE" ? "Hoạt động" : "Khóa";

            const icon = tr.querySelector("i.bx");
            icon.className =
              "bx " +
              (user.userStatus === "ACTIVE" ? "bxs-lock" : "bxs-lock-open");
            loadCustomers();
          })
          .catch((err) => console.error("Update status error:", err));
      });
    });
  }

  // ============================================
  //  Load lần đầu & Load khi thay đổi filter
  // ============================================
  userKeyword.addEventListener("input", loadCustomers);
  userStatus.addEventListener("change", loadCustomers);

  loadCustomers();

});

// ============================================
//  Hiển thị thông tin chi tiết khách hàng
// ============================================
let pageNumber = 0;
function showInfo(userId) {
  pageNumber = 0;
  const tr = document.querySelector(`tr[data-user-id='${userId}']`);

  const container = document.getElementById("userDetailContent");

  container.innerHTML = `
    <div><b>Username:</b> ${tr.dataset.username}</div>
    <div><b>Họ:</b> ${tr.dataset.firstname}</div>
    <div><b>Tên:</b> ${tr.dataset.lastname}</div>
    <div><b>Giới tính:</b> ${tr.dataset.gender}</div>
    <div><b>Ngày sinh:</b> ${tr.dataset.dob}</div>
    <div><b>Email:</b> ${tr.dataset.email}</div>
    <div><b>SĐT:</b> ${tr.dataset.phone}</div>
    <div id="status-info"><b>Trạng thái:</b> ${tr.dataset.status}</div>
  `;

  document.getElementById("userDetailModal").classList.remove("d-none");

  const token = localStorage.getItem("token");

  fetch(`http://localhost:8080/tech-store/api/orders/statistics/user/${userId}`, {
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  }).then(res => res.json())
    .then(data => {
      const stats = data.result;
      const container = document.getElementById("orderStats");
      const formatMoney = (amount) =>
        new Intl.NumberFormat("vi-VN").format(amount) + " đ";

      const ratingClass =
        stats.rating === "GOOD"
          ? "good"
          : stats.rating === "BAD"
            ? "bad"
            : "normal";

      if (!stats) {
        container.innerHTML = `<p class="text-center mt-4">Bạn chưa có đơn hàng nào.</p>`;
      } else {
        container.innerHTML = `
    <div class="stat-card">
      <div class="stat-title">Tổng đơn</div>
      <div class="stat-value">${stats.totalOrders}</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Hoàn thành</div>
      <div class="stat-value">${stats.completedOrders}</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Đã hủy</div>
      <div class="stat-value">${stats.cancelledOrders}</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Doanh thu</div>
      <div class="stat-value">${formatMoney(stats.totalCompletedAmount)}</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Tỉ lệ hủy</div>
      <div class="stat-value">${stats.cancelRate.toFixed(1)}%</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Đánh giá</div>
      <div class="stat-value ${ratingClass}">${stats.rating}</div>
    </div>
  `;
      }
    })
    .catch(err => {
      console.error("Error loading orders:", err);
    });

  loadOrderList(userId);
}

function loadOrderList(userId) {

  const token = localStorage.getItem("token");

  let url = `http://localhost:8080/tech-store/api/orders/user/${userId}`;

  const params = [];
  if (pageNumber > 0) params.push(`page=${pageNumber}`);
  params.push(`size=5`);

  url += "?" + params.join("&");

  fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  })
    .then(res => res.json())
    .then(data => {
      if (!data.result || data.result.length === 0) {
        document.querySelector(".orders-grid").innerHTML =
          `<p class="text-center mt-4">Bạn chưa có đơn hàng nào.</p>`;
        allOrders = [];
      } else {
        allOrders = data.result.content;
        renderOrders(allOrders);
        renderPagination(userId,
          data.result.totalPages,
          data.result.pageable.pageNumber
        );
      }

      // Cập nhật badge số lượng
      updateOrderBadge(allOrders.length);
    })
    .catch(err => {
      console.error("Error loading orders:", err);
    });
}



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

function renderPagination(userId, totalPages, currentPage0) {
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
        loadOrderList(userId)

        document.getElementById("orderList")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      };

      li.appendChild(btn);
    }

    container.appendChild(li);
  });
}


// =============================
//  HIỂN THỊ ĐƠN HÀNG
// =============================
function renderOrders(orders) {
  const container = document.getElementById("orderList");

  container.innerHTML = orders.map(o => `
        <div class="order-card">

          <div class="order-header">
            <div>#${o.orderCode}</div>
            <div>${new Date(o.createdAt).toLocaleString("vi-VN")}</div>
          </div>

          <div class="order-body">
            <div class="product-images">
              ${o.orderItems.map(item => `<img src="${item.productImageUrl}">`).join("")}
            </div>

            <div style="width: 145px;">
              <div><b>${new Intl.NumberFormat("vi-VN").format(o.totalAmount)} VND</b></div>
              <span class="status-info ${o.orderStatus}">
                ${getStatusText(o.orderStatus)}
              </span>
            </div>
          </div>

        </div>
      `).join("");
}

function getStatusText(status) {
  switch (status) {
    case "PENDING": return "Đang xử lý";
    case "CONFIRMED": return "Đã xác nhận";
    case "SHIPPED": return "Đang giao";
    case "CANCELLED": return "Đã hủy";
    case "COMPLETED": return "Hoàn thành";
    default: return status;
  }
}

// =============================
//  CẬP NHẬT BADGE SỐ ĐƠN HÀNG
// =============================
function updateOrderBadge(count) {
  const badge = document.querySelector(".nav-link.active .badge");
  if (badge) {
    badge.textContent = count;
  }
}

function closeUserModal() {
  document.getElementById("userDetailModal").classList.add("d-none");
}


