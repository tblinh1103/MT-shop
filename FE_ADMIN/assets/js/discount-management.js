document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Modal tạo mới
  const addBtn = document.querySelector(".btn-add-discount");
  const createModal = new bootstrap.Modal(document.getElementById("createDiscountModal"));
  addBtn.addEventListener("click", () => createModal.show());

  // ============================================
  //  Xác nhận tạo mã giảm giá
  // ============================================
  const createForm = document.getElementById("createDiscountForm");
  createForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }
    createDiscount(token, createModal);
  });

  // ============================================
  //  Xác nhận sửa mã giảm giá
  // ============================================
  const editForm = document.getElementById("editDiscountForm");
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }
    updateDiscount(token);
  });

  // ============================================
  //  Load lần đầu
  // ============================================
  loadDiscounts(token);
});

// ============================================
//  Khai báo biến
// ============================================
const filterSearch = document.getElementById("filter-search");
const filterDateFrom = document.getElementById("filter-date-from");
const filterDateTo = document.getElementById("filter-date-to");
const filterSystemStatus = document.getElementById("filter-system-status");
const filterEffectiveStatus = document.getElementById("filter-effective-status");
const filterAvailabilityStatus = document.getElementById("filter-availability-status");
const filterDiscountRange = document.getElementById("filter-discount-range");
let pageSizeSelect = document.getElementById("page-size-select");
let pageNumber = 0;
// ============================================
//  Load danh sách discount
// ============================================
function loadDiscounts(token) {
  let url = 'http://localhost:8080/tech-store/api/discounts/filter';

  const params = [];
  if (pageNumber > 0) params.push(`page=${pageNumber}`);
  if (pageSizeSelect.value) params.push(`size=${pageSizeSelect.value}`);
  if (filterSystemStatus.value)
    params.push(`systemStatus=${filterSystemStatus.value}`);
  if (filterEffectiveStatus.value)
    params.push(`effectiveStatus=${filterEffectiveStatus.value}`);
  if (filterAvailabilityStatus.value)
    params.push(`availabilityStatus=${filterAvailabilityStatus.value}`);

  if (filterDiscountRange.value) {
    const range = filterDiscountRange.value.split('-');

    if (range.length === 2) {
      const minPercent = range[0];
      const maxPercent = range[1];

      params.push(`minPercent=${minPercent}`);
      params.push(`maxPercent=${maxPercent}`);
    }
  }

  if (filterSearch.value)
    params.push(`keyword=${filterSearch.value}`);

  if (filterDateFrom.value) {
    params.push(`startDateFrom=${filterDateFrom.value}`);
  }
  if (filterDateTo.value) {
    params.push(`startDateTo=${filterDateTo.value}`);
  }

  if (params.length > 0) {
    url += "?" + params.join("&");
  }
  fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(data => {
      renderDiscountTable(token, data.result.content);
      renderPagination(data.result.totalPages, data.result.number);
    })
    .catch(err => console.error("Lỗi load discounts:", err));
}

// ------------------------------
// Build phân trang
// ------------------------------
const token = localStorage.getItem("token");
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
        loadDiscounts(token);

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
// Filter trạng thái đơn hàng
// ------------------------------
filterSystemStatus.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterEffectiveStatus.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterAvailabilityStatus.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterSearch.addEventListener("input", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterDateFrom.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterDateTo.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

filterDiscountRange.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

pageSizeSelect.addEventListener("change", () => {
  pageNumber = 0;
  loadDiscounts(token);
});

// ============================================
//  Hiể thị bảng discount
// ============================================
const map = {
  UPCOMING: "st-upcoming",
  ACTIVE: "st-active",
  EXPIRED: "st-expired",
  INACTIVE: "st-inactive",
  USED_UP: "st-used"
};

const label = {
  UPCOMING: "Chưa bắt đầu",
  ACTIVE: "Đang hoạt động",
  EXPIRED: "Hết hạn",
  INACTIVE: "Bị khóa",
  USED_UP: "Hết lượt sử dụng"
};

function renderDiscountTable(token, discounts) {
  const tbody = document.querySelector("#discount-table tbody");
  tbody.innerHTML = "";

  discounts.forEach(discount => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", discount.discountId);

    const startDate = new Date(discount.startDate).toLocaleDateString("vi-VN");
    const endDate = new Date(discount.endDate).toLocaleDateString("vi-VN");
    const minAmount = discount.minOrderAmount.toLocaleString("vi-VN") + "đ";
    const maxAmount = discount.maxDiscountAmount.toLocaleString("vi-VN") + "đ";

    // // Kiểm tra ngày hết hạn
    // const endDateCheck = new Date(discount.endDate);
    // const now = new Date();

    // // reset giờ về 00:00:00
    // endDateCheck.setHours(0, 0, 0, 0);
    // now.setHours(0, 0, 0, 0);

    // if (endDateCheck < now && discount.isActive) {
    //   fetch(`http://localhost:8080/tech-store/api/discounts/${discount.discountId}/status`, {
    //     method: "PUT",
    //     headers: {
    //       "Authorization": `Bearer ${token}`,
    //       "Content-Type": "application/json"
    //     }
    //   })
    // }

    // Render table
    tr.innerHTML = `
      <td class="align-middle p-3">${discount.code}</td>
      <td class="align-middle">${discount.description}</td>
      <td class="align-middle">${discount.discountPercent}%</td>
      <td class="align-middle">${minAmount}</td>
      <td class="align-middle">${maxAmount}</td>
      <td class="align-middle">${discount.remainingQuantity}/${discount.totalQuantity}</td>
      <td class="align-middle">${startDate}</td>
      <td class="align-middle">${endDate}</td>
      <td class="align-middle">${discount.isActive ? "Hoạt động" : "Khóa"}</td>
      <td class="align-middle">
        <span class="${map[discount.status]}">
          ${label[discount.status]}
        </span>
      </td>
      <td class="align-middle">
        ${discount.isActive
        ? `<button class="btn btn-sm btn-warning text-white btn-update-status"><i class="bx bxs-lock"></i></button>`
        : `<button class="btn btn-sm btn-warning text-white btn-update-status"><i class="bx bxs-lock-open"></i></button>`
      }
        <button class="btn btn-sm btn-primary text-white btn-update-discount"><i class="bi bi-pencil-square"></i></button>
        <button class="btn btn-sm btn-danger text-white btn-delete-discount"><i class="bx bx-trash"></i></button>
      </td>
    `;

    tbody.appendChild(tr);

    // Toggle trạng thái
    tr.querySelector(".btn-update-status").addEventListener("click", function () {
      toggleDiscountStatus(tr.getAttribute("data-id"), this);
    });

    // Edit discount
    tr.querySelector(".btn-update-discount").addEventListener("click", function () {
      openEditModal(discount);
    });

    // Delete discount
    tr.querySelector(".btn-delete-discount").addEventListener("click", function () {
      deleteDiscount(discount.discountId);
    });
  });
}

// ============================================
//  Tạo mã giảm giá
// ============================================
function createDiscount(token, modalInstance) {
  const data = {
    code: document.getElementById("code").value,
    description: document.getElementById("description").value,
    discountPercent: Number(document.getElementById("discountPercent").value),
    minOrderAmount: Number(document.getElementById("minOrderAmount").value),
    maxDiscountAmount: Number(document.getElementById("maxDiscountAmount").value),
    totalQuantity: Number(document.getElementById("totalQuantity").value),
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    isActive: document.getElementById("isActive").checked
  };

  if (new Date(data.startDate) > new Date(data.endDate)) {
    showModal({
      title: "Thông báo",
      message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
      type: "danger",
      autoClose: true,
      duration: 3000
    });
    return;
  }

  fetch("http://localhost:8080/tech-store/api/discounts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.code === 1000) {
        showModal({
          title: "Thông báo",
          message: "Tạo mã giảm giá thành công: " + response.result.code,
          type: "success",
          autoClose: true,
          duration: 3000
        });
        modalInstance.hide();
        pageNumber = 0;
        loadDiscounts(token);
        document.getElementById("createDiscountForm").reset();
      } else {
        showModal({
          title: "Thông báo",
          message: "Lỗi: " + response.message,
          type: "danger",
          autoClose: true,
          duration: 3000
        });
      }
    })
    .catch(err => console.error("Lỗi create discount:", err));
}

// ============================================
//  Mở modal sửa và điền dữ liệu
// ============================================
function openEditModal(discount) {
  document.getElementById("editDiscountId").value = discount.discountId;
  document.getElementById("editCode").value = discount.code;
  document.getElementById("editDescription").value = discount.description;
  document.getElementById("editDiscountPercent").value = discount.discountPercent;
  document.getElementById("editMinOrderAmount").value = discount.minOrderAmount;
  document.getElementById("editMaxDiscountAmount").value = discount.maxDiscountAmount;
  document.getElementById("editQuantity").value = discount.quantity;
  document.getElementById("editStartDate").value = discount.startDate;
  document.getElementById("editEndDate").value = discount.endDate;
  document.getElementById("editIsActive").checked = discount.isActive;

  const editModal = new bootstrap.Modal(document.getElementById("editDiscountModal"));
  editModal.show();
}

// ============================================
//  Cập nhật mã giảm giá
// ============================================
function updateDiscount(token) {
  const discountId = document.getElementById("editDiscountId").value;
  const data = {
    code: document.getElementById("editCode").value,
    description: document.getElementById("editDescription").value,
    discountPercent: Number(document.getElementById("editDiscountPercent").value),
    minOrderAmount: Number(document.getElementById("editMinOrderAmount").value),
    maxDiscountAmount: Number(document.getElementById("editMaxDiscountAmount").value),
    quantity: Number(document.getElementById("editQuantity").value),
    startDate: document.getElementById("editStartDate").value,
    endDate: document.getElementById("editEndDate").value,
    isActive: document.getElementById("editIsActive").checked
  };

  if (new Date(data.startDate) > new Date(data.endDate)) {
    showModal({
      title: "Thông báo",
      message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
      type: "danger",
      autoClose: true,
      duration: 3000
    });
    return;
  }

  fetch(`http://localhost:8080/tech-store/api/discounts/${discountId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.code === 1000) {
        showModal({
          title: "Thông báo",
          message: "Cập nhật mã giảm giá thành công",
          type: "success",
          autoClose: true,
          duration: 3000
        });
        bootstrap.Modal.getInstance(document.getElementById("editDiscountModal")).hide();
        pageNumber = 0;
        loadDiscounts(token);
      } else {
        showModal({
          title: "Thông báo",
          message: "Cập nhật thất bại: " + response.message,
          type: "danger",
          autoClose: true,
          duration: 3000
        });
      }
    })
    .catch(err => console.error("Lỗi cập nhật discount:", err));
}

// ============================================
//  THAY ĐỔI TRẠNG THÁI MÃ GIẢM GIÁ
// ============================================
function toggleDiscountStatus(discountId, btn) {
  const token = localStorage.getItem("token");

  const row = btn.closest("tr");
  const endDateText = row.cells[7].textContent;

  // // ⚠️ convert lại format dd/mm/yyyy
  // const parts = endDateText.split("/");
  // const endDate = new Date(parts[2], parts[1] - 1, parts[0]);
  // const now = new Date();
  // endDate.setHours(0, 0, 0, 0);
  // now.setHours(0, 0, 0, 0);
  // if (endDate < now) {
  //   showModal({
  //     title: "Thông báo",
  //     message: "Thời gian áp dụng mã giảm giá đã hết hạn, không thể thay đổi trạng thái!",
  //     type: "danger",
  //     autoClose: true,
  //     duration: 3000
  //   });
  //   return;
  // }
  showConfirmModal("Bạn có chắc chắn muốn thay đổi trạng thái mã giảm giá này?")
    .then((confirmed) => {
      if (!confirmed) return;

      fetch(`http://localhost:8080/tech-store/api/discounts/${discountId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(response => {
          if (response.code === 1000 && response.result) {
            pageNumber = 0;
            loadDiscounts(token);
          } else {
            showModal({
              title: "Thông báo",
              message: "Cập nhật trạng thái thất bại: " + response.message,
              type: "danger",
              autoClose: true,
              duration: 3000
            });
          }
        })
        .catch(err => console.error("Lỗi đổi trạng thái:", err));
    });
}

// ============================================
//  XÓA MÃ GIẢM GIÁ
// ============================================
function deleteDiscount(discountId) {
  const token = localStorage.getItem("token");
  showConfirmModal("Bạn có chắc chắn muốn xóa mã giảm giá này?")
    .then((confirmed) => {
      if (!confirmed) return;

      fetch(`http://localhost:8080/tech-store/api/discounts/${discountId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(response => {
          if (response.code === 1000) {
            showModal({
              title: "Thông báo",
              message: "Xóa mã giảm giá thành công",
              type: "success",
              autoClose: true,
              duration: 3000
            });
            pageNumber = 0;
            loadDiscounts(token);
          } else {
            showModal({
              title: "Thông báo",
              message: "Xóa thất bại: " + response.message,
              type: "danger",
              autoClose: true,
              duration: 3000
            });
          }
        })
        .catch(err => console.error("Lỗi xóa discount:", err));
    });
}
