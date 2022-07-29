import images from '../assets/images/images';
import { useState, useEffect } from 'react'

function Achievements({ serial, inUse }) {
    const [achievementText, setAchievementText] = useState('')

    useEffect(() => {
        switch(serial) {
            case "0":
                setAchievementText("Wealthy: An achievement rewarded to players that have over 10,000 coins in storage.")
                break;
            case "1":
                setAchievementText("Talented: An achievement rewarded to players that have won 3 or more games.")
                break;
            case "2":
                setAchievementText("Stacked Deck: An achievement rewarded to players that have gone to showdown with a flush or higher.")
                break;
            default:
        }
    }, [serial])

    if (inUse) {
        return (
            <div className={"achievement-slot-" + serial}>
                <img src={images.get("achievement-" + serial)} className="achievement" alt="" />
                <span className="tooltiptext-achievement">{!achievementText ? '' : achievementText}</span>
            </div>
        )
    }

    return (null);
}

export default Achievements;