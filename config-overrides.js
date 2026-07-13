const webpack = require("webpack");

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify"),
        url: require.resolve("url"),
        vm: require.resolve("vm-browserify"),
        path: false
    });
    config.resolve.fallback = fallback;

    // Add resolution for all process/browser instances
    config.resolve.alias = {
        ...config.resolve.alias,
        'process/browser': require.resolve('process/browser.js'),
        'process': require.resolve('process/browser.js')
    };

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: require.resolve('process/browser.js')
        })
    ]);

    // Add module rules to handle .js files
    config.module.rules.push({
        test: /\.js$/,
        resolve: {
            fullySpecified: false
        }
    });

    return config;
};
