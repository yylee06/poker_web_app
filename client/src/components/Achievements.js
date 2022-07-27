import images from '../assets/images/images';

function Achievements({ serial, inUse }) {
    console.log(inUse)
    if (inUse) {
        return (
            <div className={"achievement-slot-" + serial}>
                <img src={images.get("achievement-" + serial)} className="achievement" alt="" />
            </div>
        )
    }

    return (null);
}

export default Achievements;