document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

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

    function renderStatusBars(data) {

        const orderTotal = data.pending + data.confirmed + data.shipping + data.completed + data.cancelled;
        document.getElementById("total-order").innerText = orderTotal;

        const orderStatusCount = {
            'Đang xử lý': data.pending || 0,
            'Đã xác nhận': data.confirmed || 0,
            'Đang giao hàng': data.shipping || 0,
            'Hoàn thành': data.completed || 0,
            'Đã hủy': data.cancelled || 0,
        };

        const labels = Object.keys(orderStatusCount);
        const values = Object.values(orderStatusCount);

        const total = values.reduce((a, b) => a + b, 0);

        /***********************
         * DONUT CHART
         ***********************/
        const chart = new ApexCharts(document.querySelector("#orderStatusChart"), {
            chart: {
                type: "donut",
                height: 365
            },

            colors: [
                "#f39c12", // Đang xử lý
                "#3498db", // Đã xác nhận
                "#8e44ad", // Đang giao hàng
                "#2ecc71", // Hoàn thành
                "#e74c3c"  // Đã hủy
            ],

            labels,
            series: values,

            plotOptions: {
                pie: {
                    donut: {
                        size: "65%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Tổng đơn",
                                formatter: () => total
                            }
                        }
                    }
                }
            },

            dataLabels: {
                enabled: true,
                formatter: (val) => val.toFixed(1) + "%"
            },

            legend: {
                position: "bottom", // top | bottom | left | right
            }
        });

        chart.render();
    }

    loadOrderStatistics();

});