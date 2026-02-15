module.exports = {
    expo: {
        name: "piggy-bank",
        slug: "piggy-bank",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "creditkidapp",
        userInterfaceStyle: "automatic",
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            config: {
                usesNonExemptEncryption: false,
                googleMapsApiKey: "AIzaSyBMN7YRo_mlOKjOpZudJxP9lZx_Dm87yso"
            },
            // usesAppleSignIn: true, // Requires paid Apple Developer account ($99/yr)
            supportsTablet: true,
            bundleIdentifier: "com.oribrosh.piggybank",
            googleServicesFile: "./GoogleService-Info.plist"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.oribrosh.piggybank",
            googleServicesFile: "./google-services.json",
            config: {
                googleMaps: {
                    apiKey: "AIzaSyBMN7YRo_mlOKjOpZudJxP9lZx_Dm87yso"
                }
            }
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            // ["expo-apple-authentication"], // Requires paid Apple Developer account ($99/yr)
            [
                "expo-local-authentication",
                {
                    faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID."
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "Allow $(PRODUCT_NAME) to access your photos for uploading identity documents.",
                    cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to take photos of identity documents."
                }
            ],
            [
                "expo-document-picker",
                {
                    iCloudContainerEnvironment: "Production"
                }
            ],
            [
                "@stripe/stripe-react-native",
                {
                    // merchantIdentifier: "merchant.com.oribrosh.piggybank", // Apple Pay requires paid account
                    enableGooglePay: true
                }
            ],
            "expo-router",
            [
                "expo-build-properties",
                {
                    ios: {
                        useFrameworks: "static"
                    }
                }
            ],
            "@react-native-firebase/app",
            "@react-native-firebase/auth",
            "@react-native-google-signin/google-signin",
            [
                "expo-secure-store",
                {
                    configureAndroidBackup: true,
                    faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID to securely store credentials."
                }
            ],
            [
                "expo-contacts",
                {
                    contactsPermission: "Allow $(PRODUCT_NAME) to access your contacts."
                }
            ]
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            eas: {
                projectId: "16b30160-7840-4c17-b6af-590a56372bb7"
            }
        },
        configureAndroidBackup: true,
        faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
    }
};

