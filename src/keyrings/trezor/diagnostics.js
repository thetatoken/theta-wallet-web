import packageConfig from '../../../package.json';

const SAFE_ERROR_CODES = new Set([
    'Browser_LocalNetworkPermissionMissing',
    'Device_CallInProgress',
    'Device_Disconnected',
    'Device_InvalidState',
    'Device_NotFound',
    'Device_UsedElsewhere',
    'Failure_ActionCancelled',
    'Failure_Busy',
    'Failure_InvalidSession',
    'Failure_NotInitialized',
    'Failure_PinCancelled',
    'Failure_ProcessError',
    'Method_Cancel',
    'Method_Interrupted',
    'Method_NoResponse',
    'Method_PermissionsNotGranted',
    'Popup_ConnectionMissing',
    'Transport_Missing',
]);

const SAFE_STAGES = new Set([
    'precondition',
    'getAddress',
    'comparison',
]);

export const TREZOR_CONNECT_VERSION = '9.7.3';

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
    return /^m(?:\/(?:0|[1-9][0-9]{0,9})['h]?)*$/.test(path) ? path : 'UNKNOWN';
}

export function sanitizeDiagnosticBuildVersion(version) {
    if (typeof version !== 'string') return 'local';
    return /^[0-9A-Za-z_.-]{1,40}$/.test(version) ? version : 'local';
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
