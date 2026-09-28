import React from 'react';

// Never use a dApp-supplied name, hostname or icon as its security identity.
export default function DAppOrigin({origin}) {
    return <div className="DAppOrigin">
        <div>Requesting website</div>
        <strong>{origin}</strong>
    </div>;
}
