 // ==================== التشفير والأمان ====================
        function encryptData(data) {
            return btoa(JSON.stringify(data));
        }

        function decryptData(encrypted) {
            try {
                return JSON.parse(atob(encrypted));
            } catch {
                return null;
            }
        }

        // ==================== البيانات ====================
        let currentUser = null;
        let products = [];
        let orders = [];
        let activities = [];
        let deleteId = null;
        let deleteType = null;
        let salesChart = null;
        let categoryChart = null;
        let selectedPaymentMethod = null;
        let currentLanguage = 'ar';
        let sidebarCollapsed = false;
        let deferredPrompt = null;
        let isOnline = navigator.onLine;

        // المستخدم الوحيد المسموح له بالدخول
        const ADMIN_USER = {
            id: 1,
            name: 'مدير النظام',
            email: 'admin333@example.com',
            password: 'Admin@333',
            role: 'admin'
        };

        // ==================== بيانات تجريبية أولية ====================
        const demoProducts = [
            
        ];

        const demoOrders = [

        ];

        // ==================== دوال التحميل والحفظ ====================
        function loadData() {
            try {
                const encryptedProducts = localStorage.getItem('products');
                const encryptedOrders = localStorage.getItem('orders');
                const encryptedActivities = localStorage.getItem('activities');
                const encryptedUser = localStorage.getItem('currentUser');

                products = encryptedProducts ? decryptData(encryptedProducts) || [] : [];
                orders = encryptedOrders ? decryptData(encryptedOrders) || [] : [];
                activities = encryptedActivities ? decryptData(encryptedActivities) || [] : [];

                const savedUser = encryptedUser ? decryptData(encryptedUser) : null;

                if (products.length === 0) products = [...demoProducts];
                if (orders.length === 0) orders = [...demoOrders];

                if (savedUser) {
                    currentUser = savedUser;
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }

        function saveData() {
            try {
                localStorage.setItem('products', encryptData(products));
                localStorage.setItem('orders', encryptData(orders));
                localStorage.setItem('activities', encryptData(activities));
                if (currentUser) {
                    localStorage.setItem('currentUser', encryptData(currentUser));
                }
            } catch (error) {
                console.error('Error saving data:', error);
            }
        }

        // ==================== دوال الترجمة ====================
        function setLanguage(lang) {
            currentLanguage = lang;
            document.body.className = lang === 'en' ? 'en' : '';
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

            document.querySelectorAll('[data-ar][data-en]').forEach(el => {
                el.textContent = el.getAttribute(`data-${lang}`);
            });

            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.includes(lang === 'ar' ? 'العربية' : 'English'));
            });

            localStorage.setItem('language', lang);

            if (currentUser) {
                updateStats();
                updateCharts();
                if (document.getElementById('productsSection').style.display === 'block') loadProducts();
                if (document.getElementById('ordersSection').style.display === 'block') loadOrders();
                if (document.getElementById('activitiesSection').style.display === 'block') loadActivities();
            }
        }

        // ==================== دوال وضع عدم الاتصال ====================
        function updateOnlineStatus() {
            isOnline = navigator.onLine;
            const offlineBadge = document.getElementById('offlineBadge');

            if (!isOnline) {
                offlineBadge.classList.add('show');
                showNotification(currentLanguage === 'ar' ? 'أنت الآن تعمل في وضع عدم الاتصال' : 'You are now offline', 'warning');
            } else {
                offlineBadge.classList.remove('show');
            }
        }

        // ==================== دوال تثبيت التطبيق ====================
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').classList.add('show');
        });

        async function installApp() {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                showNotification(currentLanguage === 'ar' ? 'تم تثبيت التطبيق بنجاح' : 'App installed successfully', 'success');
            }

            deferredPrompt = null;
            document.getElementById('installPrompt').classList.remove('show');
        }

        function closeInstallPrompt() {
            document.getElementById('installPrompt').classList.remove('show');
        }

        // ==================== تهيئة التطبيق ====================
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(() => {
                document.getElementById('splashScreen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('splashScreen').style.display = 'none';
                    document.getElementById('loginPage').classList.add('visible');
                }, 500);
            }, 2000);

            loadData();

            const savedLang = localStorage.getItem('language');
            if (savedLang) {
                setLanguage(savedLang);
            }

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            updateOnlineStatus();

            if (currentUser) {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboardPage').style.display = 'block';
                document.getElementById('userName').textContent = currentUser.name;
                document.getElementById('userRole').textContent = currentLanguage === 'ar' ? 'مدير النظام' : 'Admin';
                loadDashboardData();
            }

            document.addEventListener('contextmenu', (e) => e.preventDefault());

            document.addEventListener('keydown', (e) => {
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                    e.preventDefault();
                    showNotification(currentLanguage === 'ar' ? 'غير مصرح بفتح أدوات المطور' : 'Developer tools not allowed', 'error');
                }
            });
        });

        // ==================== دوال المصادقة ====================
        document.getElementById('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
                currentUser = {
                    id: ADMIN_USER.id,
                    name: ADMIN_USER.name,
                    email: ADMIN_USER.email,
                    role: ADMIN_USER.role
                };

                saveData();

                activities.unshift({
                    id: activities.length + 1,
                    user: currentUser.name,
                    action: 'login',
                    target: 'system',
                    details: 'تسجيل دخول ناجح',
                    timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                });

                saveData();

                showNotification(currentLanguage === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', 'success');

                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboardPage').style.display = 'block';
                document.getElementById('userName').textContent = currentUser.name;
                document.getElementById('userRole').textContent = currentLanguage === 'ar' ? 'مدير النظام' : 'Admin';

                loadDashboardData();
            } else {
                showNotification(currentLanguage === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password', 'error');
            }
        });

        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.querySelector('.toggle-password');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }

        function toggleSidebar() {
            sidebarCollapsed = !sidebarCollapsed;
            document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
            document.getElementById('mainContent').classList.toggle('expanded', sidebarCollapsed);
        }

        function logout() {
            if (currentUser) {
                activities.unshift({
                    id: activities.length + 1,
                    user: currentUser.name,
                    action: 'logout',
                    target: 'system',
                    details: 'تسجيل خروج',
                    timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                });
                saveData();
            }

            currentUser = null;
            localStorage.removeItem('currentUser');

            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('dashboardPage').style.display = 'none';

            showNotification(currentLanguage === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logout successful', 'success');
        }

        function showSection(section) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            event.currentTarget.classList.add('active');

            document.querySelectorAll('#dashboardSection, #productsSection, #ordersSection, #activitiesSection').forEach(el => {
                el.style.display = 'none';
            });

            document.getElementById(section + 'Section').style.display = 'block';

            const titles = {
                'dashboard': { title: currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard', subtitle: currentLanguage === 'ar' ? 'نظرة عامة على النظام' : 'System Overview' },
                'products': { title: currentLanguage === 'ar' ? 'إدارة المنتجات' : 'Products Management', subtitle: currentLanguage === 'ar' ? 'عرض وإدارة جميع المنتجات' : 'View and manage all products' },
                'orders': { title: currentLanguage === 'ar' ? 'إدارة الطلبات' : 'Orders Management', subtitle: currentLanguage === 'ar' ? 'عرض وإدارة جميع الطلبات' : 'View and manage all orders' },
                'activities': { title: currentLanguage === 'ar' ? 'سجل النشاطات' : 'Activities Log', subtitle: currentLanguage === 'ar' ? 'تتبع جميع النشاطات في النظام' : 'Track all system activities' }
            };

            document.getElementById('pageTitle').textContent = titles[section].title;
            document.getElementById('pageSubtitle').textContent = titles[section].subtitle;

            if (section === 'dashboard') {
                loadDashboardData();
            } else if (section === 'products') {
                loadProducts();
            } else if (section === 'orders') {
                loadOrders();
            } else if (section === 'activities') {
                loadActivities();
            }
        }

        // ==================== دوال لوحة التحكم ====================
        function loadDashboardData() {
            updateStats();
            updateCharts();
        }

        function updateStats() {
            const statsGrid = document.getElementById('statsGrid');

            const totalProducts = products.length;
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>${currentLanguage === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</h3>
                        <span class="stat-number">${totalProducts}</span>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-box"></i>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>${currentLanguage === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</h3>
                        <span class="stat-number">${totalOrders}</span>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>${currentLanguage === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</h3>
                        <span class="stat-number">$${totalSales.toFixed(2)}</span>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                </div>
            `;
        }

        function updateCharts() {
            const ctx1 = document.getElementById('salesChart').getContext('2d');

            if (salesChart) salesChart.destroy();

            salesChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: currentLanguage === 'ar' ?
                        ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] :
                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: currentLanguage === 'ar' ? 'المبيعات' : 'Sales',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            const ctx2 = document.getElementById('categoryChart').getContext('2d');

            const categories = {};
            products.forEach(product => {
                categories[product.category] = (categories[product.category] || 0) + 1;
            });

            if (categoryChart) categoryChart.destroy();

            categoryChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#f8961e']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // ==================== دوال المنتجات ====================
        function loadProducts() {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = '';

            products.forEach(product => {
                const row = document.createElement('tr');

                const stockClass = product.stock === 0 ? 'stock-zero' : product.stock < 10 ? 'stock-low' : 'stock-high';
                const stockText = product.stock === 0 ?
                    (currentLanguage === 'ar' ? 'غير متوفر' : 'Out of Stock') :
                    product.stock < 10 ?
                        (currentLanguage === 'ar' ? 'مخزون محدود' : 'Low Stock') :
                        (currentLanguage === 'ar' ? 'متوفر' : 'In Stock');

                row.innerHTML = `
                    <td><i class="fas fa-image" style="font-size: 30px; color: var(--primary);"></i></td>
                    <td>${product.name}</td>
                    <td>$${product.price}</td>
                    <td><span class="stock-badge ${stockClass}">${product.stock} - ${stockText}</span></td>
                    <td>${product.category}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="openEditProductModal(${product.id})">
                                <i class="fas fa-edit"></i> ${currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button class="btn-delete" onclick="openDeleteModal('product', ${product.id})">
                                <i class="fas fa-trash"></i> ${currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(row);
            });
        }

        function openProductModal() {
            document.getElementById('productModalTitle').textContent = currentLanguage === 'ar' ? 'إضافة منتج جديد' : 'Add New Product';
            document.getElementById('productId').value = '';
            document.getElementById('productForm').reset();
            document.getElementById('productModal').classList.add('active');
        }

        function openEditProductModal(id) {
            const product = products.find(p => p.id === id);
            if (product) {
                document.getElementById('productModalTitle').textContent = currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product';
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productImage').value = product.image || '';

                document.getElementById('productModal').classList.add('active');
            }
        }

        function closeProductModal() {
            document.getElementById('productModal').classList.remove('active');
        }

        document.getElementById('productForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const productData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                category: document.getElementById('productCategory').value,
                image: document.getElementById('productImage').value || 'default.jpg'
            };

            const productId = document.getElementById('productId').value;

            if (productId) {
                const index = products.findIndex(p => p.id == productId);
                if (index !== -1) {
                    products[index] = { ...products[index], ...productData };

                    activities.unshift({
                        id: activities.length + 1,
                        user: currentUser.name,
                        action: 'update',
                        target: 'product',
                        details: `تحديث المنتج: ${productData.name}`,
                        timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                    });

                    showNotification(currentLanguage === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully', 'success');
                }
            } else {
                const newProduct = {
                    id: products.length + 1,
                    ...productData
                };
                products.push(newProduct);

                activities.unshift({
                    id: activities.length + 1,
                    user: currentUser.name,
                    action: 'create',
                    target: 'product',
                    details: `إضافة منتج جديد: ${productData.name}`,
                    timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                });

                showNotification(currentLanguage === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully', 'success');
            }

            saveData();
            loadProducts();
            loadProductSelects();
            updateStats();
            updateCharts();

            closeProductModal();
        });

        // ==================== دوال الطلبات ====================
        function loadOrders() {
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '';

            orders.forEach(order => {
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td><strong>${order.invoiceNumber}</strong></td>
                    <td>${order.customerName}</td>
                    <td>$${order.totalPrice}</td>
                    <td>${getPaymentMethodName(order.paymentMethod)}</td>
                    <td><span class="stock-badge stock-high">${currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</span></td>
                    <td>${order.date}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-view" onclick="viewInvoice(${order.id})">
                                <i class="fas fa-eye"></i> ${currentLanguage === 'ar' ? 'عرض' : 'View'}
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(row);
            });
        }

        function getPaymentMethodName(method) {
            const methods = {
                'cash': currentLanguage === 'ar' ? 'نقدي' : 'Cash',
                'card': currentLanguage === 'ar' ? 'بطاقة' : 'Card',
                'bank-transfer': currentLanguage === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'
            };
            return methods[method] || method;
        }

        function openOrderModal() {
            document.getElementById('orderForm').reset();
            document.getElementById('paymentMethod').value = '';
            selectedPaymentMethod = null;

            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('selected');
            });

            document.getElementById('orderModal').classList.add('active');
            loadProductSelects();
            calculateTotal();
        }

        function closeOrderModal() {
            document.getElementById('orderModal').classList.remove('active');
        }

        function loadProductSelects() {
            const selects = document.querySelectorAll('.product-select');
            const options = '<option value="">' + (currentLanguage === 'ar' ? 'اختر منتج' : 'Select Product') + '</option>' +
                products.filter(p => p.stock > 0).map(p =>
                    `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price} (${currentLanguage === 'ar' ? 'متوفر' : 'Available'}: ${p.stock})</option>`
                ).join('');

            selects.forEach(select => {
                select.innerHTML = options;
            });
        }

        function addProductRow() {
            const container = document.getElementById('orderProducts');
            const newRow = document.createElement('div');
            newRow.className = 'product-row';
            newRow.style.marginBottom = '10px';
            newRow.style.display = 'flex';
            newRow.style.gap = '10px';
            newRow.innerHTML = `
                <select class="product-select" style="flex: 2; padding: 10px; border: 2px solid var(--border); border-radius: 8px;" onchange="calculateTotal()">
                    <option value="">${currentLanguage === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
                    ${products.filter(p => p.stock > 0).map(p =>
                `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price}</option>`
            ).join('')}
                </select>
                <input type="number" class="product-quantity" placeholder="${currentLanguage === 'ar' ? 'الكمية' : 'Quantity'}" min="1" value="1" style="flex: 1; padding: 10px; border: 2px solid var(--border); border-radius: 8px;" onchange="calculateTotal()">
                <button type="button" onclick="this.parentElement.remove(); calculateTotal();" style="padding: 10px; background: var(--danger); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(newRow);
            loadProductSelects();
        }

        function calculateTotal() {
            let subtotal = 0;
            const rows = document.querySelectorAll('.product-row');

            rows.forEach(row => {
                const select = row.querySelector('.product-select');
                const quantity = parseInt(row.querySelector('.product-quantity').value) || 0;

                if (select.value && quantity > 0) {
                    const price = parseFloat(select.options[select.selectedIndex].dataset.price);
                    subtotal += price * quantity;
                }
            });

            const tax = subtotal * 0.15;
            const total = subtotal + tax;

            document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
            document.getElementById('tax').textContent = '$' + tax.toFixed(2);
            document.getElementById('total').textContent = '$' + total.toFixed(2);
        }

        function selectPaymentMethod(method) {
            selectedPaymentMethod = method;
            document.getElementById('paymentMethod').value = method;

            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('selected');
            });

            event.currentTarget.classList.add('selected');
        }

        document.getElementById('orderForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const customerName = document.getElementById('customerName').value;
            const paymentMethod = document.getElementById('paymentMethod').value;

            if (!paymentMethod) {
                showNotification(currentLanguage === 'ar' ? 'الرجاء اختيار طريقة الدفع' : 'Please select payment method', 'error');
                return;
            }

            const orderProducts = [];
            const rows = document.querySelectorAll('.product-row');
            let canProcess = true;

            rows.forEach(row => {
                const select = row.querySelector('.product-select');
                const quantity = parseInt(row.querySelector('.product-quantity').value);

                if (select.value && quantity > 0) {
                    const product = products.find(p => p.id == select.value);

                    if (product.stock < quantity) {
                        showNotification(`${currentLanguage === 'ar' ? 'المنتج' : 'Product'} ${product.name} ${currentLanguage === 'ar' ? 'غير متوفر بهذه الكمية' : 'out of stock'}`, 'error');
                        canProcess = false;
                        return;
                    }

                    orderProducts.push({
                        productId: product.id,
                        name: product.name,
                        quantity: quantity,
                        price: product.price
                    });
                }
            });

            if (!canProcess) return;

            if (orderProducts.length === 0) {
                showNotification(currentLanguage === 'ar' ? 'الرجاء اختيار منتج واحد على الأقل' : 'Please select at least one product', 'error');
                return;
            }

            let subtotal = 0;
            orderProducts.forEach(item => {
                subtotal += item.price * item.quantity;
            });
            const tax = subtotal * 0.15;
            const total = subtotal + tax;

            showNotification(currentLanguage === 'ar' ? 'جاري معالجة الدفع...' : 'Processing payment...', 'warning');

            setTimeout(() => {
                const paymentSuccess = Math.random() < 0.9;

                if (paymentSuccess) {
                    orderProducts.forEach(item => {
                        const product = products.find(p => p.id == item.productId);
                        product.stock -= item.quantity;
                    });

                    const newOrder = {
                        id: orders.length + 1,
                        invoiceNumber: generateInvoiceNumber(),
                        customerName: customerName,
                        products: orderProducts,
                        totalPrice: total,
                        paymentMethod: paymentMethod,
                        status: 'completed',
                        date: new Date().toLocaleDateString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                    };

                    orders.unshift(newOrder);

                    activities.unshift({
                        id: activities.length + 1,
                        user: currentUser.name,
                        action: 'sale',
                        target: 'order',
                        details: `فاتورة جديدة: ${newOrder.invoiceNumber} - $${total.toFixed(2)}`,
                        timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                    });

                    showInvoice(newOrder.invoiceNumber, total);

                    saveData();
                    loadProducts();
                    loadOrders();
                    updateStats();
                    updateCharts();

                    closeOrderModal();

                    showNotification(currentLanguage === 'ar' ? 'تم إتمام الدفع وإنشاء الفاتورة بنجاح' : 'Payment completed successfully', 'success');
                } else {
                    showNotification(currentLanguage === 'ar' ? 'فشلت عملية الدفع. الرجاء المحاولة مرة أخرى' : 'Payment failed. Please try again', 'error');
                }
            }, 1500);
        });

        function generateInvoiceNumber() {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `INV-${year}${month}${day}-${random}`;
        }

        function viewInvoice(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                showInvoice(order.invoiceNumber, order.totalPrice);
            }
        }

        function showInvoice(invoiceNumber, total) {
            document.getElementById('invoiceNumber').textContent = `${currentLanguage === 'ar' ? 'رقم الفاتورة' : 'Invoice'}: ${invoiceNumber}`;
            document.getElementById('invoiceTotal').textContent = `${currentLanguage === 'ar' ? 'المبلغ الإجمالي' : 'Total'}: $${total.toFixed(2)}`;
            document.getElementById('invoiceModal').classList.add('active');
        }

        function closeInvoiceModal() {
            document.getElementById('invoiceModal').classList.remove('active');
        }

        function printInvoice() {
            window.print();
        }

        // ==================== دوال الأنشطة ====================
        function loadActivities() {
            const tbody = document.getElementById('activitiesTableBody');
            tbody.innerHTML = '';

            activities.slice(0, 50).forEach(activity => {
                const row = document.createElement('tr');

                const actionNames = {
                    'create': currentLanguage === 'ar' ? 'إضافة' : 'Create',
                    'update': currentLanguage === 'ar' ? 'تحديث' : 'Update',
                    'delete': currentLanguage === 'ar' ? 'حذف' : 'Delete',
                    'sale': currentLanguage === 'ar' ? 'بيع' : 'Sale',
                    'login': currentLanguage === 'ar' ? 'تسجيل دخول' : 'Login',
                    'logout': currentLanguage === 'ar' ? 'تسجيل خروج' : 'Logout'
                };

                const targetNames = {
                    'product': currentLanguage === 'ar' ? 'منتج' : 'Product',
                    'order': currentLanguage === 'ar' ? 'طلب' : 'Order',
                    'system': currentLanguage === 'ar' ? 'نظام' : 'System'
                };

                row.innerHTML = `
                    <td>${activity.user}</td>
                    <td><span class="stock-badge stock-high">${actionNames[activity.action]}</span></td>
                    <td>${targetNames[activity.target]}</td>
                    <td>${activity.details}</td>
                    <td>${activity.timestamp}</td>
                `;

                tbody.appendChild(row);
            });
        }

        // ==================== دوال الحذف ====================
        function openDeleteModal(type, id) {
            deleteType = type;
            deleteId = id;
            document.getElementById('deleteModal').classList.add('active');
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').classList.remove('active');
            deleteType = null;
            deleteId = null;
        }

        function confirmDelete() {
            if (deleteType === 'product') {
                const product = products.find(p => p.id === deleteId);
                products = products.filter(p => p.id !== deleteId);

                activities.unshift({
                    id: activities.length + 1,
                    user: currentUser.name,
                    action: 'delete',
                    target: 'product',
                    details: `حذف المنتج: ${product.name}`,
                    timestamp: new Date().toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')
                });

                showNotification(currentLanguage === 'ar' ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully', 'success');
                loadProducts();
                loadProductSelects();
            }

            saveData();
            updateStats();
            updateCharts();
            closeDeleteModal();
        }

        // ==================== دوال الإشعارات ====================
        function showNotification(message, type) {
            const notification = document.getElementById('notification');
            notification.innerHTML = `
                <div class="notification ${type}">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                    ${message}
                </div>
            `;

            setTimeout(() => {
                notification.innerHTML = '';
            }, 3000);
        }