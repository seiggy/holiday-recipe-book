export default function Lights() {
  return (
    <div className="lights" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}
    </div>
  )
}
