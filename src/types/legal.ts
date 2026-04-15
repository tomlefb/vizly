export type RgpdRight = {
  label: string
  description: string
}

export type HostInfo = {
  title: string
  name: string
  address: string
  siteLabel: string
  website: string
  url: string
}

export type CollectedItems = {
  title: string
  intro: string
  items: string[]
}

export type RgpdSection = {
  title: string
  intro: string
  rights: RgpdRight[]
  contactPrompt: string
  contactSuffix: string
}
