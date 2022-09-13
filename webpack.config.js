module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/i,
                loader: "css-loader",
                options: {
                    url: {
                        filter: (url, resourcePath) => {
                            // resourcePath - path to css file

                            // Don't handle `img.png` urls
                            if (url.includes("img.png")) {
                                return false;
                            }

                            // Don't handle images under root-relatve /external_images/
                            if (/^\/external_images\//.test(path)) {
                                return false;
                            }

                            return true;
                        },
                    },
                },
            },
        ],
    },
};