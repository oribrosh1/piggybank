import ExpoModulesCore
import PassKit
import UIKit
import StripeApplePay

public class AppleWalletModule: Module {

    private var provisioningContext: STPPushProvisioningContext?
    private var provisioningDelegate: ProvisioningDelegate?

    public func definition() -> ModuleDefinition {
        Name("AppleWallet")

        AsyncFunction("canAddCardToWallet") {
            (cardLastFour: String, primaryAccountIdentifier: String) -> [String: Any] in

            guard PKAddPaymentPassViewController.canAddPaymentPass() else {
                return [
                    "canAddCard": false,
                    "isAlreadyAdded": false,
                    "details": "Device does not support adding payment passes",
                ]
            }

            let passLibrary = PKPassLibrary()
            let identifier = primaryAccountIdentifier.isEmpty ? nil : primaryAccountIdentifier

            if let identifier = identifier {
                let passes = passLibrary.passes(of: .payment)
                let alreadyAdded = passes.contains { pass in
                    pass.paymentPass?.primaryAccountIdentifier == identifier
                }

                if alreadyAdded {
                    return [
                        "canAddCard": false,
                        "isAlreadyAdded": true,
                        "details": "Card is already in Apple Wallet",
                    ]
                }

                let canAdd = passLibrary.canAddPaymentPass(
                    withPrimaryAccountIdentifier: identifier)
                return [
                    "canAddCard": canAdd,
                    "isAlreadyAdded": false,
                    "details": canAdd
                        ? "Card can be added"
                        : "Card cannot be added to this device",
                ]
            }

            return [
                "canAddCard": true,
                "isAlreadyAdded": false,
                "details": "Device supports adding cards (no specific identifier provided)",
            ]
        }

        AsyncFunction("startPushProvisioning") {
            (ephemeralKeyJson: String, promise: Promise) in

            guard PKAddPaymentPassViewController.canAddPaymentPass() else {
                promise.resolve([
                    "success": false,
                    "error": "Device does not support adding payment passes",
                ])
                return
            }

            guard let keyData = ephemeralKeyJson.data(using: .utf8),
                let keyDict = try? JSONSerialization.jsonObject(with: keyData)
                    as? [AnyHashable: Any]
            else {
                promise.resolve([
                    "success": false,
                    "error": "Invalid ephemeral key JSON",
                ])
                return
            }

            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    promise.resolve(["success": false, "error": "Module deallocated"])
                    return
                }

                let keyProvider = PreFetchedKeyProvider(keyJson: keyDict)
                let context = STPPushProvisioningContext(keyProvider: keyProvider)
                self.provisioningContext = context

                context.requestConfiguration { [weak self] config, error in
                    DispatchQueue.main.async {
                        guard let self = self else { return }

                        if let error = error {
                            self.cleanup()
                            promise.resolve([
                                "success": false,
                                "error": error.localizedDescription,
                            ])
                            return
                        }

                        guard let config = config else {
                            self.cleanup()
                            promise.resolve([
                                "success": false,
                                "error": "Failed to create provisioning configuration",
                            ])
                            return
                        }

                        guard let rootVC = self.topViewController() else {
                            self.cleanup()
                            promise.resolve([
                                "success": false,
                                "error": "No view controller available to present",
                            ])
                            return
                        }

                        let delegate = ProvisioningDelegate(
                            context: context,
                            promise: promise,
                            onComplete: { [weak self] in self?.cleanup() }
                        )
                        self.provisioningDelegate = delegate

                        guard
                            let addPassVC = PKAddPaymentPassViewController(
                                requestConfiguration: config,
                                delegate: delegate
                            )
                        else {
                            self.cleanup()
                            promise.resolve([
                                "success": false,
                                "error":
                                    "Cannot create Add Payment Pass controller. Ensure the com.apple.developer.payment-pass-provisioning entitlement is approved by Apple.",
                            ])
                            return
                        }

                        rootVC.present(addPassVC, animated: true)
                    }
                }
            }
        }
    }

    private func cleanup() {
        provisioningContext = nil
        provisioningDelegate = nil
    }

    private func topViewController() -> UIViewController? {
        guard
            let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }),
            let rootVC = scene.windows.first(where: { $0.isKeyWindow })?
                .rootViewController
        else {
            return nil
        }
        var topVC = rootVC
        while let presented = topVC.presentedViewController {
            topVC = presented
        }
        return topVC
    }
}

// MARK: - Wrapper delegate that forwards encryption to STPPushProvisioningContext

private class ProvisioningDelegate: NSObject, PKAddPaymentPassViewControllerDelegate {
    private let context: STPPushProvisioningContext
    private var promise: Promise?
    private let onComplete: () -> Void

    init(context: STPPushProvisioningContext, promise: Promise, onComplete: @escaping () -> Void) {
        self.context = context
        self.promise = promise
        self.onComplete = onComplete
        super.init()
    }

    func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        generateRequestWithCertificateChain certificates: [Data],
        nonce: Data,
        nonceSignature: Data,
        completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void
    ) {
        context.addPaymentPassViewController(
            controller,
            generateRequestWithCertificateChain: certificates,
            nonce: nonce,
            nonceSignature: nonceSignature,
            completionHandler: handler
        )
    }

    func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        didFinishAdding pass: PKPaymentPass?,
        error: Error?
    ) {
        context.addPaymentPassViewController(controller, didFinishAdding: pass, error: error)

        controller.dismiss(animated: true) { [weak self] in
            guard let self = self, let promise = self.promise else { return }
            self.promise = nil

            if let error = error {
                promise.resolve([
                    "success": false,
                    "error": error.localizedDescription,
                ])
            } else if pass != nil {
                promise.resolve(["success": true])
            } else {
                promise.resolve([
                    "success": false,
                    "error": "User cancelled or pass was not added",
                ])
            }

            self.onComplete()
        }
    }
}

// MARK: - Pre-fetched ephemeral key provider

private class PreFetchedKeyProvider: NSObject, STPIssuingCardEphemeralKeyProvider {
    private let keyJson: [AnyHashable: Any]

    init(keyJson: [AnyHashable: Any]) {
        self.keyJson = keyJson
        super.init()
    }

    func createIssuingCardKey(
        withAPIVersion apiVersion: String,
        completion: @escaping STPJSONResponseCompletionBlock
    ) {
        completion(keyJson, nil)
    }
}
