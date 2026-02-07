import { defineConfig } from 'wxt';

export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: {
        name: 'Sentinellium',
        description: 'The Client-Side, Privacy-Preserving AI Defense Grid',
        permissions: ['activeTab', 'storage', 'scripting'],
        host_permissions: ['<all_urls>'],
    },
});
