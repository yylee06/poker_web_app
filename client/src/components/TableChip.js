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

    return (null);
}

export default TableChip;