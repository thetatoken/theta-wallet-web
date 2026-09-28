import React, {useState, useRef} from 'react';
import Modal from '../components/Modal';
import DAppOrigin from '../components/DAppOrigin';
import FlatButton from '../components/buttons/FlatButton';
import GradientButton from '../components/buttons/GradientButton';

export default function DAppNetworkModal({origin, network, onAccept, onReject}) {
    const [busy, setBusy] = useState(false);
    const deciding = useRef(false);
    return <Modal closeable={false}>
        <div className="TxConfirmationModal DAppApproval">
            <DAppOrigin origin={origin}/>
            <div className="ModalTitle">Switch Network</div>
            <p>Allow this website to switch your wallet to {network.name || network.chainId}?</p>
            <div className="TxConfirmationModal__footer">
                <FlatButton title="Reject" onClick={() => {if (!deciding.current) onReject();}} borderless centered/>
                <GradientButton title="Switch Network" disabled={busy} onClick={() => {
                    if (deciding.current) return;
                    deciding.current = true;
                    setBusy(true);
                    onAccept();
                }}/>
            </div>
        </div>
    </Modal>;
}
