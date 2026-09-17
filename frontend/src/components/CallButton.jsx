import {VideoIcon} from "lucide-react"

function CallButton({handleVideoCall}) {
  return (
    <button 
      className='btn btn-primary btn-sm gap-1.5 font-semibold shadow-sm' 
      onClick={handleVideoCall}
      title="Start Video Call"
    >
        <VideoIcon className='size-4' />
        <span>Video Call</span>
    </button>
  )
}

export default CallButton
