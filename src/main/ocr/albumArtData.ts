import { testAlbumArtOCR } from './albumArtOCR'
import { getColorsFromHexString, getAverageHashFromLogoColor, Color } from './graphics'

export const albumArtColors: Color[][] = []
export const albumArtHashs: number[][] = []

export function setAlbumArtDatas(jacketList: string[]): void {
  albumArtColors.length = 0
  albumArtHashs.length = 0

  for (const hex of jacketList) {
    if (hex.length !== 9600) {
      console.warn('wrong HEX length:', hex.length)
      continue
    }
    const colors = getColorsFromHexString(hex)
    albumArtColors.push(colors)
    albumArtHashs.push(getAverageHashFromLogoColor(colors))
  }

  console.log('Colors length: ', albumArtColors.length)
  console.log('Hashs length: ', albumArtHashs.length)

  testAlbumArtOCR()
}
