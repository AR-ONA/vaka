import { getAverageHashFromLogoColor, getColorsFromHexString } from '../graphics'

export const albumArtColors: Uint8Array[] = []
export const albumArtHashs: number[][] = []

export function loadAlbumArtData(jacketList: string[]): void {
  if (albumArtColors.length > 0) return

  albumArtColors.length = 0
  albumArtHashs.length = 0

  for (const hex of jacketList) {
    if (hex.length !== 9600) {
      console.warn('wrong HEX length:', hex.length)
      continue
    }

    const colorsUint8Array = getColorsFromHexString(hex)
    albumArtColors.push(colorsUint8Array)
    albumArtHashs.push(getAverageHashFromLogoColor(colorsUint8Array))
  }

  console.log('Colors length: ', albumArtColors.length)
  console.log('Hashs length: ', albumArtHashs.length)
}
