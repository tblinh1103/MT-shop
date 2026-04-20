document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const categorySelect = document.getElementById("filter-category");
  const brandSelect = document.getElementById("filter-brand");
  const stockSelect = document.getElementById("filter-stock");
  const statusSelect = document.getElementById("filter-status");
  const searchProduct = document.getElementById("search-product");
  const priceMinSelect = document.getElementById("filter-price-min");
  const priceMaxSelect = document.getElementById("filter-price-max");
  const pageSize = document.getElementById("page-size");
  let currentPage = 0;


  // ============================================
  //  LOAD DANH MỤC
  // ============================================
  function loadCategories() {
    return fetch("http://localhost:8080/tech-store/api/categories", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        categorySelect.innerHTML = '<option value="">Tất cả</option>';
        data.result.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.categoryId;
          option.textContent = cat.categoryName;
          categorySelect.appendChild(option);
        });
      })
      .catch((err) => console.error("Lỗi load categories:", err));
  }

  // ============================================
  //  LOAD THƯƠNG HIỆU
  // ============================================
  function loadBrands() {
    return fetch("http://localhost:8080/tech-store/api/brands", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        brandSelect.innerHTML = '<option value="">Tất cả</option>';
        data.result.forEach((brand) => {
          const option = document.createElement("option");
          option.value = brand.brandId;
          option.textContent = brand.brandName;
          brandSelect.appendChild(option);
        });
      })
      .catch((err) => console.error("Lỗi load brands:", err));
  }

  // ============================================
  //  LOAD SẢN PHẨM
  //  (PHẢI GLOBAL → GÁN VÀO window)
  // ============================================
  window.loadProducts = function () {
    const categoryId = categorySelect.value;
    const brandId = brandSelect.value;
    let url = "http://localhost:8080/tech-store/api/products/advanced-filter";
    const params = [];
    params.push(`page=${currentPage}`);
    params.push(`size=${pageSize.value}`);
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (brandId) params.push(`brandId=${brandId}`);
    if (statusSelect.value) params.push(`status=${statusSelect.value}`);
    if (searchProduct.value) params.push(`keyword=${searchProduct.value}`);
    if (priceMinSelect.value) params.push(`minPrice=${priceMinSelect.value}`);
    if (params.length > 0) url += "?" + params.join("&");

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "login.html";
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        const tbody = document.querySelector("#products-table tbody");
        tbody.innerHTML = "";

        data.result.content.forEach((product) => {
          const mainImage =
            product.images.find((img) => img.isMain)?.imageUrl || "";

          const tr = document.createElement("tr");
          tr.dataset.productId = product.productId;
          tr.dataset.status = product.productStatus;
          tr.innerHTML = `
            <td class="p-3 text-center align-middle"><input type="checkbox"></td>
            <td><img src="${mainImage}" alt="${product.productName
            }" style="max-height: 70px;"></td>
            <td class="align-middle text-truncate">${product.productName}</td>
            <td class="align-middle">${product.category?.categoryName || ""
            }</td>
            <td class="align-middle">${product.brand?.brandName || ""}</td>
            <td class="align-middle">${product.warrantyMonths || 0} tháng</td>
            <td class="align-middle status-cell">${product.productStatus === "ACTIVE" ? "Hoạt động" : product.productStatus === "LOCKED" ? "Khóa" : "Đã xóa"
            }</td>
            <td class="align-middle">
              <button class="btn btn-sm btn-warning text-white toggle-status" title="Đổi trạng thái">
                <i class="bx ${product.productStatus === "ACTIVE" ? "bxs-lock-open"
              : product.productStatus === "LOCKED" ? "bxs-lock" :
                product.productStatus === "DELETED" ? "bxs-trash" :
                  ""}"></i>
              </button>
              <button class="btn btn-sm btn-primary text-white" onclick="editProduct('${product.productId
            }')">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-danger text-white" onclick="deleteProduct('${product.productId
            }')">
                <i class="bx bx-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        renderPagination(data.result.totalPages, data.result.pageable.pageNumber);
      })
      .catch((err) => console.error("Error loading products:", err));
  };

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

    currentPage = currentPage0 + 1; // convert sang 1-based cho UI

    const pages = buildPagination(totalPages, currentPage);

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

        if (p === currentPage) btn.classList.add("active");

        btn.onclick = () => {
          currentPage = p - 1; // quay về 0-based
          loadProducts();
          const table = document.getElementById("action-bar");

          if (table) {
            table.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        };

        li.appendChild(btn);
      }

      container.appendChild(li);
    });
  }

  categorySelect.addEventListener("change", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // lọc theo danh mục
  });
  brandSelect.addEventListener("change", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // lọc theo thương hiệu
  });
  statusSelect.addEventListener("change", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // lọc theo trạng thái
  });
  searchProduct.addEventListener("input", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // tìm kiếm sản phẩm
  });
  pageSize.addEventListener("change", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // thay đổi số lượng sản phẩm trên trang
  });

  priceMinSelect.addEventListener("input", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // lọc theo giá min
  });

  priceMaxSelect.addEventListener("input", () => {
    currentPage = 0;   // reset về trang đầu
    loadProducts();    // lọc theo giá max
  });

  // ============================================
  //  XÓA SẢN PHẨM (GLOBAL)
  // ============================================
  let selectedProductId = null;

  window.deleteProduct = async function (productId) {
    const confirmed = await showConfirmModal("Bạn có chắc muốn xóa sản phẩm này?");

    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:8080/tech-store/api/products/${productId}/status?status=DELETED`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.ok) {
        showModal({
          title: "Thành công",
          message: "Xóa sản phẩm thành công!",
          type: "success",
          autoClose: true,
          duration: 3000,
        });

        loadProducts();
      } else {
        const err = await res.json();

        showModal({
          title: "Thông báo",
          message: "Sản phẩm đã có trong đơn hàng, không thể xóa!",
          type: "danger",
          autoClose: false,
        });
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);

      showModal({
        title: "Lỗi",
        message: "Không thể kết nối đến server",
        type: "danger",
        autoClose: true,
        duration: 3000,
      });
    }
  };
  // ============================================
  //  TOGGLE STATUS (EVENT DELEGATION)
  // ============================================
  // Dùng delegation để bắt click vào nút .toggle-status (button hoặc icon)
  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".toggle-status");
    if (!btn) return;

    const tr = btn.closest("tr");
    if (!tr) return;
    const productId = tr.dataset.productId;

    if (!productId) return;

    // Disable button tạm thời để tránh double click
    btn.disabled = true;

    const currentStatus = tr.dataset.status;

    const newStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";

    fetch(`http://localhost:8080/tech-store/api/products/${productId}/status?status=${newStatus}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then(async (res) => {
        // nếu server trả status 204 hoặc 200/201, cố gắng parse json nếu có
        if (!res.ok) {
          let errText = "Đổi trạng thái thất bại";
          try {
            const err = await res.json();
            errText = err.message || errText;
          } catch (e) { }
          throw new Error(errText);
        }
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        // Chọn cách cập nhật UI: load lại cả danh sách để đồng bộ hoặc cập nhật cục bộ
        // Ở đây gọi loadProducts() để đảm bảo dữ liệu đồng bộ
        loadProducts();
      })
      .catch((err) => {
        console.error("Lỗi cập nhật trạng thái:", err);
        showModal({
          title: "Lỗi",
          message: "Không thể cập nhật trạng thái sản phẩm",
          type: "danger",
          autoClose: true,
          duration: 3000,
        });
      })
      .finally(() => {
        btn.disabled = false;
      });
  });

  // ============================================
  // Update Product
  // ============================================
  window.editProduct = function (productId) {
    window.location.href = `product-update.html?productId=${productId}`;
  };

  // ============================================
  //  Load Filters & Products lần đầu
  // ============================================
  Promise.all([loadCategories(), loadBrands()]).then(() => {
    loadProducts();
  });
});
