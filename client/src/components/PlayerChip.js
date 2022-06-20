import './PlayerChip.css';

//chips: object of parameters: inUse (boolean), chips: int
function PlayerChip({ chips }) {
    if (chips > -1) {
        return (
            <div>
                <h6 className="player_chip" id="player_chip">{chips}</h6>
            </div>
        )
    }

    return (null);
}

export default PlayerChip;