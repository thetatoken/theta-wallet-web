import packageConfig from '../../../package.json';

const SAFE_ERROR_CODES = new Set([
    'Browser_LocalNetworkPermissionMissing',
    'Desktop_ConnectionMissing',
    'Diagnostic_ConnectionTimeout',
    'Device_CallInProgress',
    'Device_Disconnected',
    'Device_FwException',
    'Device_InitializeFailed',
    'Device_InvalidState',
    'Device_ModeException',
    'Device_MultipleNotSupported',
    'Device_NotFound',
    'Device_UsedElsewhere',
    'Failure_ActionCancelled',
    'Failure_Busy',
    'Failure_InvalidSession',
    'Failure_NotInitialized',
    'Failure_PinCancelled',
    'Failure_PinInvalid',
    'Failure_ProcessError',
    'Failure_UnknownCode',
    'Init_IframeBlocked',
    'Init_IframeTimeout',
    'Method_Cancel',
    'Method_InvalidParameter',
    'Method_Interrupted',
    'Method_NoResponse',
    'Method_Override',
    'Method_PermissionsNotGranted',
    'Method_Unsupported',
    'Popup_ConnectionMissing',
    'Transport_Missing',
]);

const SAFE_STAGES = new Set([
    'precondition',
    'getPublicKey',
    'getAddress',
    'comparison',
]);

const SAFE_LOCAL_NETWORK_PERMISSION_STATES = new Set([
    'denied',
    'granted',
    'prompt',
    'unknown',
    'unsupported',
]);

export const TREZOR_CONNECT_VERSION = '9.7.3';
export const TREZOR_CONNECT_CORE_MODE = 'auto';
export const TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_MS = 90000;
export const TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_CODE = 'Diagnostic_ConnectionTimeout';

export function isTrezorDiagnosticsEnabled(search) {
    try {
        const params = new URLSearchParams(search || '');
        return params.get('trezorDiagnostics') === '1';
    }
    catch (error) {
        return false;
    }
}

export function normalizeDiagnosticAddress(address) {
    if (typeof address !== 'string') return null;
    const normalized = address.trim().toLowerCase().replace(/^0x/, '');
    return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

export function sanitizeDiagnosticErrorCode(code) {
    return SAFE_ERROR_CODES.has(code) ? code : 'UNKNOWN';
}

export function sanitizeDiagnosticPath(path) {
    if (typeof path !== 'string' || path.length > 80) return 'UNKNOWN';
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    return /^m(?:\/(?:0|[1-9][0-9]{0,9})['h]?)*$/.test(normalizedPath)
        ? normalizedPath
        : 'UNKNOWN';
}

export function sanitizeDiagnosticBuildVersion(version) {
    if (typeof version !== 'string') return 'local';
    return /^[0-9A-Za-z_.-]{1,40}$/.test(version) ? version : 'local';
}

export async function getTrezorBrowserConnectionContext(browserNavigator) {
    const safeNavigator = browserNavigator || (
        typeof navigator === 'undefined' ? null : navigator
    );
    let localNetworkPermission = 'unsupported';

    if (safeNavigator
        && safeNavigator.permissions
        && typeof safeNavigator.permissions.query === 'function') {
        try {
            const permission = await safeNavigator.permissions.query({
                name: 'local-network-access',
            });
            localNetworkPermission = SAFE_LOCAL_NETWORK_PERMISSION_STATES.has(
                permission && permission.state,
            ) ? permission.state : 'unknown';
        }
        catch (error) {
            localNetworkPermission = 'unsupported';
        }
    }

    return {
        coreMode: TREZOR_CONNECT_CORE_MODE,
        localNetworkPermission,
        webUsbAvailable: Boolean(safeNavigator && safeNavigator.usb),
    };
}

export function createTrezorConnectionDiagnosticReport({
    parentPath,
    browserContext,
    errorCode,
    settledWithinLimit,
}) {
    const safeBrowserContext = browserContext || {};

    return {
        schemaVersion: 1,
        reportType: 'connection',
        appVersion: packageConfig.version,
        buildVersion: sanitizeDiagnosticBuildVersion(process.env.REACT_APP_BUILD_VERSION),
        trezorConnectVersion: TREZOR_CONNECT_VERSION,
        mode: 'opt-in',
        status: 'error',
        parentPath: sanitizeDiagnosticPath(parentPath),
        connection: {
            coreMode: TREZOR_CONNECT_CORE_MODE,
            localNetworkPermission: SAFE_LOCAL_NETWORK_PERMISSION_STATES.has(
                safeBrowserContext.localNetworkPermission,
            ) ? safeBrowserContext.localNetworkPermission : 'unknown',
            webUsbAvailable: safeBrowserContext.webUsbAvailable === true,
            settledWithinLimit: settledWithinLimit === true,
        },
        error: {
            stage: 'getPublicKey',
            code: sanitizeDiagnosticErrorCode(errorCode),
        },
    };
}

export function withTrezorDiagnosticConnectionTimeout(
    connectionPromise,
    timeoutMs = TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_MS,
    cancelConnection = null,
) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        return Promise.resolve(connectionPromise);
    }

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const error = new Error('Trezor diagnostic connection timed out');
            error.code = TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_CODE;
            if (typeof cancelConnection === 'function') {
                try {
                    const cancellation = cancelConnection(error);
                    if (cancellation && typeof cancellation.catch === 'function') {
                        cancellation.catch(() => {});
                    }
                }
                catch (cancellationError) {
                    // The timeout report remains valid even if the SDK cannot cancel.
                }
            }
            reject(error);
        }, timeoutMs);

        Promise.resolve(connectionPromise).then(
            result => {
                clearTimeout(timeoutId);
                resolve(result);
            },
            error => {
                clearTimeout(timeoutId);
                reject(error);
            },
        );
    });
}

export function createTrezorDiagnosticReport({
    parentPath,
    childPath,
    publicKeyCheck,
    addressCheck,
    comparison = null,
    error = null,
}) {
    const safePublicKeyCheck = {
        success: publicKeyCheck.success === true,
        publicKeyBytes: Number.isInteger(publicKeyCheck.publicKeyBytes)
            ? publicKeyCheck.publicKeyBytes
            : 0,
        chainCodeBytes: Number.isInteger(publicKeyCheck.chainCodeBytes)
            ? publicKeyCheck.chainCodeBytes
            : 0,
        returnedPathMatches: publicKeyCheck.returnedPathMatches === true,
        deviceStateAvailable: publicKeyCheck.deviceStateAvailable === true,
    };
    const safeAddressCheck = {
        success: addressCheck.success === true,
        returnedPathMatches: addressCheck.returnedPathMatches === true,
        deviceStateAvailable: addressCheck.deviceStateAvailable === true,
        displayConfirmed: addressCheck.displayConfirmed === true,
    };
    const safeComparison = comparison ? {
        sameDeviceWalletState: comparison.sameDeviceWalletState === true,
        localMatchesDevice: comparison.localMatchesDevice === true,
        uiMatchesLocal: comparison.uiMatchesLocal === true,
    } : null;
    const safeError = error ? {
        stage: SAFE_STAGES.has(error.stage) ? error.stage : 'precondition',
        code: sanitizeDiagnosticErrorCode(error.code),
    } : null;
    const passed = !safeError
        && safePublicKeyCheck.success
        && safePublicKeyCheck.publicKeyBytes === 33
        && safePublicKeyCheck.chainCodeBytes === 32
        && safePublicKeyCheck.returnedPathMatches
        && safePublicKeyCheck.deviceStateAvailable
        && safeAddressCheck.success
        && safeAddressCheck.returnedPathMatches
        && safeAddressCheck.deviceStateAvailable
        && safeAddressCheck.displayConfirmed
        && safeComparison
        && safeComparison.sameDeviceWalletState
        && safeComparison.localMatchesDevice
        && safeComparison.uiMatchesLocal;

    return {
        schemaVersion: 1,
        appVersion: packageConfig.version,
        buildVersion: sanitizeDiagnosticBuildVersion(process.env.REACT_APP_BUILD_VERSION),
        trezorConnectVersion: TREZOR_CONNECT_VERSION,
        mode: 'opt-in',
        status: safeError ? 'error' : (passed ? 'passed' : 'mismatch'),
        parentPath: sanitizeDiagnosticPath(parentPath),
        childPath: sanitizeDiagnosticPath(childPath),
        getPublicKey: safePublicKeyCheck,
        getAddress: safeAddressCheck,
        comparison: safeComparison,
        error: safeError,
    };
}
