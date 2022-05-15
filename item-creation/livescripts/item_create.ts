import { emptyQuality, itemClassInfo, qualityMultiplier, statGroups } from "./const_creations";
import { getRandNumber } from "./livescripts";

let startID = 200000
const templateItemID = 38

const displayDict = CreateDictionary<uint32, TSDictionary<uint32, TSDictionary<uint32, TSDictionary<uint32, TSArray<uint32>>>>>({//quality
    2: emptyQuality,
    3: emptyQuality,
    4: emptyQuality,
    5: emptyQuality,
})

export function itemCreate(events: TSEvents) {
    startID = getOpenID()
    setupDisplayIDDict()

    events.Player.OnCommand((player, command, found) => {
        const cmd = command.get().split(' ')
        if (cmd[0] == 'createitem') {
            // this 1 only works with the modified wow.exe.
            //the other parts work without. the exe mods are only needed for
            //newly generated items rather than modified items
            //there could be some updates(ex. a class/subclass/icon change)
            //that would require the exe mod. untested but assumptions
            found.set(true)
            createItemRandom(player)
        } else if (cmd[0] == 'updateitem') {
            //this will add the thori'dal spell to your ranged wep
            //also adds 5 stam to show stat reloading
            found.set(true)
            let item = player.GetItemByPos(255, 17)
            //player.RemoveAllItemMods()//other option rather than slot ID reloading
            player.RemoveItemMods(item, 17)
            let t = item.GetTemplate()
            t.SetStatsCount(1)
            t.SetStatType(0, 7)
            t.SetStatValue(0, 5)
            t.SetSpellID(0, 46699)
            t.SetSpellTrigger(0, 1)
            player.ApplyItemMods(item, 17, true, true)
            //player.ApplyAllItemMods()//other option rather than slot ID reloading
            player.SendItemQueryPacket(t)
            //player.SendItemQueryPacket(item.GetEntry())//other option
        } else if (cmd[0] == 'resetitem') {
            //this removes the thoridal spell from your ranged wep
            //also removes 5 stam to show stat reloading
            found.set(true)
            let item = player.GetItemByPos(255, 17)
            //player.RemoveAllItemMods()//other option rather than slot ID reloading
            player.RemoveItemMods(item, 17)
            let t = item.GetTemplate()
            t.SetStatsCount(0)
            t.SetStatType(0, 0)
            t.SetStatValue(0, 0)
            t.SetSpellID(0, 0)
            t.SetSpellTrigger(0, 0)
            player.ApplyItemMods(item, 17, true, true)
            //player.ApplyAllItemMods()//other option rather than slot ID reloading
            player.SendItemQueryPacket(t)
            //player.SendItemQueryPacket(item.GetEntry())//other option
        }
    })
}

function createItemRandom(player: TSPlayer) {
    let temp: TSItemTemplate = CreateItemTemplate(startID++, templateItemID)
    temp = setupItem(temp, chooseItemType(), player.GetLevel())
    player.SendItemQueryPacket(temp)
    player.AddItem(temp.GetEntry(), 1)
}

export function createItemWithChoices(player: TSPlayer, i1: number, i2: number, level: uint32): TSItem {
    let temp: TSItemTemplate = CreateItemTemplate(startID++, templateItemID)
    temp = setupItem(temp, itemClassInfo[i1][i2], level)
    player.SendItemQueryPacket(temp)
    return player.AddItem(temp.GetEntry(), 1)
}

function setupItem(temp: TSItemTemplate, itemInfo: TSArray<float>, playerLevel: uint32): TSItemTemplate {
    const itemLevel: uint32 = ((playerLevel * 2) * qualityMultiplier[temp.GetQuality()]) + 1
    temp.SetItemLevel(itemLevel);
    temp.SetRequiredLevel(playerLevel)
    temp.SetQuality(GetRandQuality())
    temp.SetStatsCount(temp.GetQuality() - 1)

    temp.SetClass(itemInfo[0])
    temp.SetSubClass(itemInfo[1])
    temp.SetInventoryType(itemInfo[2])
    temp.SetMaterial(itemInfo[3])
    temp.SetSheath(itemInfo[4])

    if (temp.GetClass() == 4)//if armor or shield/tome
    {
        if (temp.GetSubClass() != 23)//if not tome
        {
            temp.SetArmor(<uint32>(10 * itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
        }
        if (itemInfo[2] == 14)//if shield
        {
            temp.SetBlock(<uint32>(itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
        }

    } else {//setup weapon swing damage
        temp.SetDamageMinA(<uint32>(10 * itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
        temp.SetDamageMaxA(<uint32>(20 * itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
        if (temp.GetQuality() == 5) {
            temp.SetDamageMinB(<uint32>(3 * itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
            temp.SetDamageMaxB(<uint32>(5 * itemLevel * itemInfo[5] * qualityMultiplier[temp.GetQuality()]))
        }
        if (itemInfo[2] == 13) {//1h
            temp.SetDelay(1700 + (getRandNumber(5) * 100))
        } else if (itemInfo[2] == 17) {//2h
            temp.SetDelay(2500 + (getRandNumber(5) * 100))
        } else if (itemInfo[2] == 26) {//ranged
            temp.SetDelay(1800 + (getRandNumber(5) * 100))
        }
    }
    temp.SetName(getName(itemInfo, temp.GetQuality()))
    temp.SetDisplayInfoID(getDisplayID(itemInfo, temp.GetQuality()))
    temp = generateStats(itemLevel, temp, itemInfo[5])

    temp.Save()
    return temp
}


function getOpenID(): uint32 {
    //we start our custom items at 200k//perhaps QueryWorld('SELECT MAX(entry) FROM item_template') and saved as const at top of file
    let q = QueryCharacters('SELECT MAX(entry) FROM custom_item_template')
    while (q.GetRow()) {
        return (q.GetUInt32(0) + 1)
    }
    return startID
}

function GetRandQuality(): number {
    let qualityCheck = getRandNumber(100)
    if (qualityCheck < 50) {//uncommon
        return 2
    } else if (qualityCheck < 80) {//rare
        return 3
    } else if (qualityCheck < 98) {//epic
        return 4
    } else {//legendary
        return 5
    }
}

function chooseItemType(): TSArray<float> {
    let qualityCheck = getRandNumber(100)
    if (qualityCheck < 85) {//armor
        return itemClassInfo[0][getRandNumber(itemClassInfo[0].length)]
    } else {//weapon
        return itemClassInfo[1][getRandNumber(itemClassInfo[1].length)]
    }
}

function getDisplayID(itemInfoArr: TSArray<float>, quality: uint32): uint32 {
    let chose = displayDict[quality][itemInfoArr[0]][itemInfoArr[2]][itemInfoArr[1]]
    return chose[getRandNumber(chose.length)]
}



function setupDisplayIDDict() {
    //quality->class->invType->subclass->[displayIDs]
    let q = QueryCharacters('SELECT * FROM custom_item_template_displays')
    while (q.GetRow()) {
        displayDict[q.GetUInt32(0)][q.GetUInt32(1)][q.GetUInt32(3)][q.GetUInt32(2)].push(q.GetUInt32(4))
    }

}

function getName(itemInfoArr: TSArray<float>, quality: uint32): string {
    let name = ""
    //base name
    let q = QueryCharacters('SELECT name FROM custom_item_template_names WHERE nametype = 2 AND class = ' + itemInfoArr[0] + ' AND subclass = ' + itemInfoArr[1] + ' AND invtype = ' + itemInfoArr[2] + ' ORDER BY RAND() LIMIT 1')
    while (q.GetRow()) {
        name = q.GetString(0)
    }

    if (quality > 2) {//prefix
        let q = QueryCharacters('SELECT name FROM custom_item_template_names WHERE nametype = 1 ORDER BY RAND() LIMIT 1')
        while (q.GetRow()) {
            name = q.GetString(0) + " " + name
        }
    }

    if (quality == 4 || quality == 5) {//suffix
        q = QueryCharacters('SELECT name FROM custom_item_template_names WHERE  nametype = 3 ORDER BY RAND() LIMIT 1')
        while (q.GetRow()) {
            name += " " + q.GetString(0)
        }
    }
    return name
}

function generateStats(itemLevel: uint32, temp: TSItemTemplate, slotMult: float): TSItemTemplate {
    let group = statGroups[getRandNumber(statGroups.length)]
    let totalStats = slotMult * itemLevel * 20 * qualityMultiplier[temp.GetQuality()]
    let statsPrimary: uint32 = totalStats * .7
    let statsSecondary: uint32 = totalStats * .3
    let flat1 = statsPrimary * .1//forced value to each stat
    let flat2 = statsSecondary * .1//forced value to each stat
    let stats = CreateDictionary<uint32, int32>({})
    //apply flats
    for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < group[i].length; j++) {
            if (i == 0) {
                stats[group[i][j]] = flat1
                statsPrimary -= flat1
            }
            if (i == 1) {
                stats[group[i][j]] = flat2
                statsSecondary -= flat2
            }
        }
    }
    //distribute primary stats
    while (statsPrimary > 0) {
        stats[group[0][getRandNumber(group[0].length)]]++
        statsPrimary--
    }
    //distribute secondary stats
    while (statsSecondary > 0) {
        stats[group[1][getRandNumber(group[1].length)]]++
        statsSecondary--
    }
    //apply stats to item
    let index = 0
    stats.forEach((key, val) => {
        temp.SetStatType(index, key)
        temp.SetStatValue(index, val)
        index++
    })
    temp.SetStatsCount(index)
    return temp
}