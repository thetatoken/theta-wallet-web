/** @jest-environment node */

import {
    createTrezorDiagnosticReport,
    isTrezorDiagnosticsEnabled,
    normalizeDiagnosticAddress,
    sanitizeDiagnosticBuildVersion,
    sanitizeDiagnosticErrorCode,
    sanitizeDiagnosticPath,
    TREZOR_CONNECT_VERSION,
} from './diagnostics';

const installedTrezorConnectVersion = require('@trezor/connect-web/package.json').version;

const passingReportInput = {
    parentPath: "m/44'/60'/0'/0",
    childPath: "m/44'/60'/0'/0/0",
    publicKeyCheck: {
        success: true,
        publicKeyBytes: 33,
        chainCodeBytes: 32,
        returnedPathMatches: true,
        deviceStateAvailable: true,
    },
    addressCheck: {
        success: true,
        returnedPathMatches: true,
        deviceStateAvailable: true,
        displayConfirmed: true,
    },
    comparison: {
        sameDeviceWalletState: true,
        localMatchesDevice: true,
        uiMatchesLocal: true,
    },
};

describe('Trezor diagnostic report helpers', () => {
    it('enables diagnostics only for the explicit query value', () => {
        expect(isTrezorDiagnosticsEnabled('?trezorDiagnostics=1')).toBe(true);
        expect(isTrezorDiagnosticsEnabled('?other=1&trezorDiagnostics=1')).toBe(true);
        expect(isTrezorDiagnosticsEnabled('?trezorDiagnostics=true')).toBe(false);
        expect(isTrezorDiagnosticsEnabled('?trezorDiagnostics=0')).toBe(false);
        expect(isTrezorDiagnosticsEnabled('')).toBe(false);
    });

    it('normalizes only valid Ethereum-style addresses', () => {
        expect(normalizeDiagnosticAddress(' 0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD ')).toBe(
            'abcdefabcdefabcdefabcdefabcdefabcdefabcd',
        );
        expect(normalizeDiagnosticAddress('not-an-address')).toBeNull();
        expect(normalizeDiagnosticAddress(null)).toBeNull();
    });

    it('allowlists error codes and rejects arbitrary text', () => {
        expect(sanitizeDiagnosticErrorCode('Device_Disconnected')).toBe('Device_Disconnected');
        expect(sanitizeDiagnosticErrorCode('customer-specific secret')).toBe('UNKNOWN');
        expect(sanitizeDiagnosticErrorCode(undefined)).toBe('UNKNOWN');
    });

    it('allows only derivation-path syntax in report paths', () => {
        expect(sanitizeDiagnosticPath("m/44'/60'/0'/0/0")).toBe("m/44'/60'/0'/0/0");
        expect(sanitizeDiagnosticPath('m/44h/60h/0h/0/0')).toBe('m/44h/60h/0h/0/0');
        expect(sanitizeDiagnosticPath('sensitive path text')).toBe('UNKNOWN');
        expect(sanitizeDiagnosticPath(null)).toBe('UNKNOWN');
    });

    it('allows only bounded build identifiers', () => {
        expect(sanitizeDiagnosticBuildVersion('17b887f529fb2c393a713201a33db086724e9229')).toBe(
            '17b887f529fb2c393a713201a33db086724e9229',
        );
        expect(sanitizeDiagnosticBuildVersion('release-2026.07.25')).toBe('release-2026.07.25');
        expect(sanitizeDiagnosticBuildVersion('build with sensitive text')).toBe('local');
        expect(sanitizeDiagnosticBuildVersion('a'.repeat(41))).toBe('local');
        expect(sanitizeDiagnosticBuildVersion(null)).toBe('local');
    });

    it('reports the installed Trezor Connect version', () => {
        expect(TREZOR_CONNECT_VERSION).toBe(installedTrezorConnectVersion);
    });

    it('reports a passing verification with only explicit fields', () => {
        const report = createTrezorDiagnosticReport(passingReportInput);

        expect(report.status).toBe('passed');
        expect(Object.keys(report)).toEqual([
            'schemaVersion',
            'appVersion',
            'buildVersion',
            'trezorConnectVersion',
            'mode',
            'status',
            'parentPath',
            'childPath',
            'getPublicKey',
            'getAddress',
            'comparison',
            'error',
        ]);
        expect(report.error).toBeNull();
    });

    it('fails the report when any load-bearing comparison is false', () => {
        const report = createTrezorDiagnosticReport({
            ...passingReportInput,
            comparison: {
                ...passingReportInput.comparison,
                sameDeviceWalletState: false,
            },
        });

        expect(report.status).toBe('mismatch');
        expect(report.comparison.sameDeviceWalletState).toBe(false);
    });

    it('does not copy arbitrary properties into the report', () => {
        const report = createTrezorDiagnosticReport({
            ...passingReportInput,
            parentPath: 'sensitive parent path',
            childPath: 'sensitive child path',
            publicKeyCheck: {
                ...passingReportInput.publicKeyCheck,
                publicKey: 'sensitive-public-key',
            },
            addressCheck: {
                ...passingReportInput.addressCheck,
                address: 'sensitive-address',
                device: 'sensitive-device',
            },
            comparison: {
                ...passingReportInput.comparison,
                sessionId: 'sensitive-session',
            },
            error: {
                stage: 'unexpected-stage',
                code: 'sensitive-error',
                message: 'sensitive-message',
            },
        });
        const serialized = JSON.stringify(report);

        expect(serialized).not.toContain('sensitive');
        expect(report.parentPath).toBe('UNKNOWN');
        expect(report.childPath).toBe('UNKNOWN');
        expect(report.error).toEqual({
            stage: 'precondition',
            code: 'UNKNOWN',
        });
    });
});
