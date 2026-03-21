import { Spinner } from "../Components/ui/spinner";

const Loading = ({size = 4, className}: {size?: number, className?: string}) => {
  return (
    <Spinner className={`size-${size} ${className}`} />
  )
}

export default Loading