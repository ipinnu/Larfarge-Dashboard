interface Props {
  assetName: string;
  size?: number;
}

function imageForAsset(assetName: string): string {
  const name = assetName.toLowerCase();
  if (name.includes('isuzu') || name.includes('hino') || name.includes('ford')) {
    return '/assets/vehicles/light-truck.svg';
  }
  if (name.includes('scania') || name.includes('daf') || name.includes('man')) {
    return '/assets/vehicles/tipper.svg';
  }
  return '/assets/vehicles/heavy-truck.svg';
}

export default function AssetThumbnail({ assetName, size = 40 }: Props) {
  return (
    <div className="bpl-asset-thumb" style={{ width: size, height: size }} title={assetName}>
      <img src={imageForAsset(assetName)} alt="" aria-hidden onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    </div>
  );
}
