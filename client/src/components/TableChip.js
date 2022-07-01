import './TableChip.css';

//chips: object of parameters: inUse (boolean), chips: int
function TableChip({ chips }) {
    if (chips > 0) {
        return (
            <span className="table-chip">
                <h6 className="chip-value">{chips}</h6>
            </span>
        )
    }

    return (
        <span className="table-chip" style={{visibility: "hidden"}} >
            <h6 className="chip-value">0</h6>
        </span>
    )
}

export default TableChip;