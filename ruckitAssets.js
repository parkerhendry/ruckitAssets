/**
 * Geotab Ruckit Assets Add-in
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.ruckitAssets = function () {
    'use strict';

    let api;
    let state;
    let elAddin;
    let assetsData = [];

    /**
     * Make a Geotab API call
     */
    function makeGeotabCall(method, typeName, parameters = {}) {
        return new Promise((resolve, reject) => {
            const callParams = {
                typeName: typeName,
                ...parameters
            };
            
            api.call(method, callParams, resolve, reject);
        });
    }

    /**
     * Get AddInData entries for Ruckit mappings
     */
    async function getRuckitMappings() {
        try {
            const searchParams = {
                whereClause: 'type = "ri-device"'
            };
            
            const data = await makeGeotabCall("Get", "AddInData", { search: searchParams });
            return data || [];
        } catch (error) {
            console.error('Error fetching Ruckit mappings:', error);
            return [];
        }
    }

    /**
     * Load and display Ruckit assets data
     */
    async function loadRuckitAssets() {
        if (!api) {
            showAlert('Geotab API not initialized. Please refresh the page.', 'danger');
            return;
        }
        
        try {
            showAlert('Loading Ruckit assets...', 'info');
            
            const ruckitData = await getRuckitMappings();
            assetsData = ruckitData;
            
            renderAssetsTable(assetsData);
            updateAssetCount(assetsData.length);
            
            if (assetsData.length > 0) {
                showAlert(`Successfully loaded ${assetsData.length} Ruckit assets`, 'success');
            } else {
                showAlert('No Ruckit assets found', 'info');
            }
            
        } catch (error) {
            console.error('Error loading Ruckit assets:', error);
            showAlert('Error loading Ruckit assets: ' + error.message, 'danger');
            showEmptyState();
        }
    }

    /**
     * Render the assets table
     */
    function renderAssetsTable(data) {
        const tableBody = document.getElementById('assetsTableBody');
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            showEmptyState();
            return;
        }
        
        const tableRows = data.map(item => {
            const details = item.details || {};
            const assetName = details.name || 'N/A';
            const ruckitDevice = details['ri-device'] || 'N/A';
            const ruckitDriver = details['ri-driver'] || 'N/A';
            const ruckitToken = details['ri-token'] || 'N/A';
            
            return `
                <tr>
                    <td>
                        <i class="fas fa-truck me-2 text-primary"></i>
                        ${escapeHtml(assetName)}
                    </td>
                    <td>
                        <span class="badge bg-orange text-white">${escapeHtml(ruckitDevice)}</span>
                    </td>
                    <td>
                        <i class="fas fa-user me-2 text-secondary"></i>
                        ${escapeHtml(ruckitDriver)}
                    </td>
                    <td>
                        <code class="text-muted">${escapeHtml(ruckitToken)}</code>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableRows;
    }

    /**
     * Show empty state in table
     */
    function showEmptyState() {
        const tableBody = document.getElementById('assetsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h5>No Ruckit Assets Found</h5>
                        <p>No assets with Ruckit device mappings were found in the system.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Update asset count badge
     */
    function updateAssetCount(count) {
        const assetCountEl = document.getElementById('assetCount');
        if (assetCountEl) {
            assetCountEl.textContent = count;
        }
    }

    /**
     * Show alert messages
     */
    function showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alertId = 'alert-' + Date.now();
        
        const iconMap = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}" role="alert">
                <i class="fas fa-${iconMap[type]} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert && typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh data function (exposed globally)
     */
    window.refreshData = function() {
        loadRuckitAssets();
    };

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Ctrl/Cmd + R to refresh data
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                loadRuckitAssets();
            }
        });
    }

    return {
        /**
         * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
         * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
         * is ready for the user.
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
         *        might be doing asynchronous operations, you must call this method when the Add-In is ready
         *        for display to the user.
         */
        initialize: function (freshApi, freshState, initializeCallback) {
            api = freshApi;
            state = freshState;

            elAddin = document.getElementById('ruckitAssets');

            if (state.translate) {
                state.translate(elAddin || '');
            }
            
            initializeCallback();
        },

        /**
         * focus() is called whenever the Add-In receives focus.
         *
         * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
         * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
         * the global state of the MyGeotab application changes, for example, if the user changes the global group
         * filter in the UI.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        focus: function (freshApi, freshState) {
            api = freshApi;
            state = freshState;

            // Setup event listeners
            setupEventListeners();
            
            // Load Ruckit assets data
            loadRuckitAssets();
            
            // Show main content
            if (elAddin) {
                elAddin.style.display = 'block';
            }
        },

        /**
         * blur() is called whenever the user navigates away from the Add-In.
         *
         * Use this function to save the page state or commit changes to a data store or release memory.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        blur: function () {
            // Hide main content
            if (elAddin) {
                elAddin.style.display = 'none';
            }
        }
    };
};