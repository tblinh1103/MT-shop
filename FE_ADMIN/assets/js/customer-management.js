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
                  <i class="bx ${user.userStatus === "ACTIVE" ? "bxs-lock" : "bxs-lock-open"
            }"></i>
                </button>
                <button class="btn btn-sm btn-primary text-white" onclick="editUser('${user.userId
            }')">
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



