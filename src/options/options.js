class OptionsManager {
    constructor() {
        // Default settings
        this.defaultSettings = {
            aiProvider: 'custom',
            apiKey: '',
            endpoint: '',
            model: 'gpt-3.5-turbo',
            summaryLength: 'medium',
            language: 'chinese',
            autoSummarize: false,
            promptTemplate: '',
            enableHN: true,
            enableReddit: false
        };

        // Provider configurations
        this.providerConfigs = {
            custom: {
                name: 'Custom Endpoint',
                fields: [
                    {
                        id: 'endpoint',
                        label: 'API Endpoint URL',
                        type: 'url',
                        required: true,
                        placeholder: 'https://your-api-endpoint.com'
                    },
                    {
                        id: 'apiKey',
                        label: 'API Key',
                        type: 'password',
                        required: true,
                        placeholder: 'Your API key'
                    },
                    {
                        id: 'model',
                        label: 'Model (Optional)',
                        type: 'text',
                        required: false,
                        placeholder: 'Model identifier if required by your API'
                    }
                ]
            },
            openai: {
                name: 'OpenAI',
                fields: [
                    {
                        id: 'apiKey',
                        label: 'API Key',
                        type: 'password',
                        required: true
                    },
                    {
                        id: 'model',
                        label: 'Model',
                        type: 'select',
                        options: [
                            { value: 'gpt-4', label: 'GPT-4' },
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                        ],
                        required: true
                    }
                ]
            },
            anthropic: {
                name: 'Anthropic (Claude)',
                fields: [
                    {
                        id: 'apiKey',
                        label: 'API Key',
                        type: 'password',
                        required: true
                    },
                    {
                        id: 'model',
                        label: 'Model',
                        type: 'select',
                        options: [
                            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' }
                        ],
                        required: true
                    }
                ]
            },
            cloudflare: {
                name: 'Cloudflare AI Worker',
                fields: [
                    {
                        id: 'endpoint',
                        label: 'Worker URL',
                        type: 'url',
                        required: true
                    },
                    {
                        id: 'apiKey',
                        label: 'API Key',
                        type: 'password',
                        required: true
                    }
                ]
            }
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateProviderSettings();
    }

    async loadSettings() {
        try {
            // Load saved settings
            const settings = await chrome.storage.sync.get(this.defaultSettings);
            this.populateFields(settings);
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showStatus('Error loading settings', true);
        }
    }

    setupEventListeners() {
        // AI Provider change handler
        document.getElementById('aiProvider').addEventListener('change', (e) => {
            this.updateProviderSettings();
        });

        // Save button handler
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Clear status on form changes
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('change', () => {
                this.clearStatus();
            });
        });
    }

    updateProviderSettings() {
        const container = document.getElementById('providerSettings');
        const provider = document.getElementById('aiProvider').value;
        const config = this.providerConfigs[provider];

        if (!config) {
            container.innerHTML = '<p class="text-red-500">Invalid provider configuration</p>';
            return;
        }

        // Create provider-specific fields
        const fields = config.fields.map(field => this.createField(field)).join('');
        container.innerHTML = fields;

        // Populate field values
        this.populateProviderFields(provider);
    }

    createField(field) {
        const commonClasses = 'w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 mt-1';
        
        let input;
        switch (field.type) {
            case 'select':
                input = `
                    <select id="${field.id}" class="${commonClasses}">
                        ${field.options.map(opt => `
                            <option value="${opt.value}">${opt.label}</option>
                        `).join('')}
                    </select>
                `;
                break;
            
            case 'textarea':
                input = `
                    <textarea 
                        id="${field.id}" 
                        class="${commonClasses}" 
                        placeholder="${field.placeholder || ''}"
                        rows="4"
                    ></textarea>
                `;
                break;
            
            default:
                input = `
                    <input 
                        type="${field.type}" 
                        id="${field.id}" 
                        class="${commonClasses}"
                        ${field.required ? 'required' : ''}
                        placeholder="${field.placeholder || ''}"
                    >
                `;
        }

        return `
            <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">
                    ${field.label}
                    ${field.required ? '<span class="text-red-500">*</span>' : ''}
                </label>
                ${input}
            </div>
        `;
    }

    populateFields(settings) {
        // Populate base settings
        document.getElementById('aiProvider').value = settings.aiProvider;
        document.getElementById('language').value = settings.language;
        document.getElementById('summaryLength').value = settings.summaryLength;
        document.getElementById('autoSummarize').checked = settings.autoSummarize;
        
        if (settings.promptTemplate) {
            document.getElementById('promptTemplate').value = settings.promptTemplate;
        }

        // Populate provider fields
        this.populateProviderFields(settings.aiProvider);
    }

    populateProviderFields(provider) {
        const config = this.providerConfigs[provider];
        if (!config) return;

        chrome.storage.sync.get(this.defaultSettings, (settings) => {
            config.fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element && settings[field.id]) {
                    element.value = settings[field.id];
                }
            });
        });
    }

    async saveSettings() {
        const saveButton = document.getElementById('saveSettings');
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        try {
            const settings = await this.collectSettings();
            
            // Validate required fields
            const provider = this.providerConfigs[settings.aiProvider];
            const requiredFields = provider.fields.filter(f => f.required);
            
            for (const field of requiredFields) {
                if (!settings[field.id]) {
                    throw new Error(`${field.label} is required`);
                }
            }

            // Save settings to storage
            await chrome.storage.sync.set(settings);
            this.showStatus('Settings saved successfully!');

        } catch (error) {
            console.error('Save error:', error);
            this.showStatus(error.message, true);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Settings';
        }
    }

    async collectSettings() {
        const settings = {
            aiProvider: document.getElementById('aiProvider').value,
            language: document.getElementById('language').value,
            summaryLength: document.getElementById('summaryLength').value,
            autoSummarize: document.getElementById('autoSummarize').checked,
            promptTemplate: document.getElementById('promptTemplate').value
        };

        // Collect provider-specific settings
        const provider = this.providerConfigs[settings.aiProvider];
        if (provider) {
            provider.fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    settings[field.id] = element.value;
                }
            });
        }

        console.log('Saving settings:', settings);
        return settings;
    }

    showStatus(message, isError = false) {
        const statusElement = document.getElementById('saveStatus');
        statusElement.textContent = message;
        statusElement.className = `text-sm ${isError ? 'text-red-500' : 'text-green-500'}`;

        if (!isError) {
            setTimeout(() => this.clearStatus(), 3000);
        }
    }

    clearStatus() {
        const statusElement = document.getElementById('saveStatus');
        statusElement.textContent = '';
        statusElement.className = 'text-sm text-gray-500';
    }
}

// Initialize options manager
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
