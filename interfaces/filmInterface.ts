export interface origFilmResourceScheme {
    id: string,
    name: string, // title in original verions. but we hardcode change to have the same search index for all tables.
    episode_id: number,
    opening_crawl: string,
    director: string,
    producer: string,
    release_date: string,
    characters: string[],
    planets: string[],
    starships: string[],
    vehicles: string[],
    species: string[],
    created: string,
    edited: string,
    url: string,
}

export interface wookieeFilmResourceScheme {
    id: string,
    origId: string,
    aoahaoanwo: string, // title in original verions. but we hardcode change to have the same search index for all tables.
    woakahcoowawo_ahwa: number,
    ooakwowhahwhrr_oarcraohan: string,
    waahrcwooaaooorc: string,
    akrcoowahuoaworc: string,
    rcwoanworacwo_waraaowo: string,
    oaacrarcraoaaoworcc: string[],
    akanrawhwoaoc: string[],
    caorarccacahakc: string[],
    howoacahoaanwoc: string[],
    cakwooaahwoc: string[],
    oarcworaaowowa: string,
    wowaahaowowa: string,
    hurcan: string,
}