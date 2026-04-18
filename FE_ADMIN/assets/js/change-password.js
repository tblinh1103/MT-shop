document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#profile-change-password form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const renewPassword = document.getElementById("renewPassword").value.trim();

    if (!currentPassword || !newPassword || !renewPassword) {
      showModal({
        title: "Thông báo",
        message: "Vui lòng nhập đầy đủ thông tin.",
        type: "danger",
        autoClose: true,
        duration: 3000
      });
      return;
    }

    if (newPassword !== renewPassword) {
      showModal({
        title: "Thông báo",
        message: "Mật khẩu mới nhập lại không trùng khớp!",
        type: "danger",
        autoClose: true,
        duration: 3000
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showModal({
        title: "Thông báo",
        message: "Bạn chưa đăng nhập!",
        type: "danger",
        autoClose: true,
        duration: 3000
      });
      return;
    }

    const payload = {
      currentPassword: currentPassword,
      newPassword: newPassword,
    };

    try {
      const response = await fetch(
        "http://localhost:8080/tech-store/api/users/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.code === 1000) {
        showModal({
          title: "Thông báo",
          message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
          type: "success",
          autoClose: true,
          duration: 3000
        });

        // Xóa token
        localStorage.removeItem("token");

        // Chuyển về trang login
        window.location.href = "/login.html"; // đổi theo đường dẫn thực tế của bạn
      } else {
        showModal({
          title: "Thông báo",
          message: data.message || "Đổi mật khẩu thất bại!",
          type: "danger",
          autoClose: true,
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      showModal({
        title: "Thông báo",
        message: "Có lỗi xảy ra. Vui lòng thử lại sau.",
        type: "danger",
        autoClose: true,
        duration: 3000
      });
    }
  });
});
