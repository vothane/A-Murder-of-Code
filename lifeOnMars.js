// Bacterial Foraging Optimization Algorithm

function randomVector(minmax) {
    let vector = new Array(minmax.length).fill(0)
    return vector.map((_, idx) => minmax[idx][0] + ((minmax[idx][1] - minmax[idx][0]) * Math.random()))
}

function randDirection(probSize) {
    let bounds = new Array(probSize).fill([-1.0, 1.0])
    return randomVector(bounds)
}

function forcifyCells(thisCell, otherCells, d, w) {
    let sumDiff =
        (vecThis, vecOther) =>
            vecThis.reduce(
                (diff, ignore, idx) => diff + (vecThis[idx] - vecOther[idx])**2.0, 0.0)

    let sum =
        otherCells.reduce(
            (sum, otherCell) =>
            {
                let diff = sumDiff(thisCell.get('vector'), otherCell.get('vector'))
                return sum + (d * Math.exp(w * diff))
            }, 0.0)
    return sum
}

function diffForce(cell, cells, dAttr, wAttr, hRepel, wRepel) {
    let lightSide = forcifyCells(cell, cells, -dAttr, -wAttr)
    let darkSide = forcifyCells(cell, cells, hRepel, -wRepel)
    return lightSide + darkSide
}

function evalCell(cell, cells, dAttr, wAttr, hRep, wRep) {
    cell.set('cost', objectiveFunction(cell.get('vector')))
    cell.set('inter', diffForce(cell, cells, dAttr, wAttr, hRep, wRep))
    cell.set('fitness', cell.get('cost') + cell.get('inter'))
    return true
}

function forcePushCell(searchSpace, cell, stepSize) {
    const step = randDirection(searchSpace.length)
    const cellVector = cell.get('vector')
    let tempVec = new Array(searchSpace.length).fill(0)

    newVector =
        tempVec.map(
            (_, idx) => {
                let el = cellVector[idx] + stepSize * step[idx]
                if (el < searchSpace[idx][0]) el = searchSpace[idx][0]
                if (el > searchSpace[idx][1]) el = searchSpace[idx][1]
                return el
            })

    let m = new Map()
    m.set('vector', newVector)
    return m
}

function chemotaxis(cells, searchSpace, chemSteps, swimLength, stepSize, dAttr, wAttr, hRep, wRep) {
    let best = null

    for (let step = 0; step < chemSteps; step++) {
        let movedCells = new Array()

        for (let cell of cells) {
                let sumNutrients = 0.0
                evalCell(cell, cells, dAttr, wAttr, hRep, wRep)
                if (best === null || cell.get('cost') < best.get('cost')) best = cell
                sumNutrients += cell.get('fitness')

                for (let stroke = 0; stroke < swimLength; stroke++) {
                    let newCell = forcePushCell(searchSpace, cell, stepSize)
                    evalCell(newCell, cells, dAttr, wAttr, hRep, wRep)
                    if (cell.get('cost') < best.get('cost')) best = cell
                    if (newCell.get('fitness') > cell.get('fitness')) break
                    cell = newCell
                    sumNutrients += cell.get('fitness')
                }
                cell.set('sumNutrients', sumNutrients)
                movedCells.push(cell)
            }
        cells = movedCells
    }
    return new Array(best, cells)
}

function search(searchSpace, popSize, elimDispSteps, reprSteps, chemSteps, swimLength, stepSize, dAttr, wAttr, hRep, wRep, pEliminate) {
    let cells = new Array(popSize).fill(new Map())
    cells.map(
       (cell) => {
           return cell.set('vector', randomVector(searchSpace))
       })
    let best = null

    for (let elds = 0; elds <= elimDispSteps; elds++) {
        for (let reps = 0; reps <= reprSteps; reps++) {
            let [cBest, newCells] =
                chemotaxis(cells, searchSpace, chemSteps, swimLength, stepSize, dAttr, wAttr, hRep, wRep)
            cells = newCells
            if (best === null || cBest.get('cost') < best.get('cost')) best = cBest
            cells.sort(
                (c1, c2) => {
                    let [a, b] = [c1.get('sumNutrients'), c2.get('sumNutrients')]
                    if (a < b) {
                        return -1
                    } else if (a > b) {
                        return 1
                    } else {
                        return 0
                    }
                })
            let halfCells = cells.slice(0, Math.floor(popSize / 2))
            cells = halfCells.concat([...halfCells])
        }
        cells.forEach(
            (cell) => {
                if (Math.random() <= pEliminate) {
                    cell.set('vector', randomVector(searchSpace))
                } else {
                    return
                }
            })
    }
    return best
}

function objectiveFunction(vector) {
    return vector.reduce((sum, x) => sum + (x ** 2.0), 0.0)
}

const assert = function(condition, message) {
    if (!condition)
        throw Error('Assert failed: ' + (message || ''))
}

let randVec = randomVector([[-5, 5], [-5, 5]])
assert(randVec.every(el => -5 <= el <= 5))
console.log("randVec: " + randVec)

let randDir = randDirection(2)
assert(randDir.every(el => -1 <= el <= 1))
console.log("randDir: " + randDir)

let a = new Map([['vector', [-2.439264243575975, 3.7868841646918323]], ['cost', 20.290501726782033]])
let b = new Map([['vector', [-2.439264243575975, 3.7868841646918323]], ['cost', 20.290501726782033]])
let c = new Map([['vector', [3.7059292300503053, -3.6083282934267844]], ['cost', 20.290501726782033]])
let d = new Map([['vector', [2.7341815844816164, 2.52840106562293] ], ['cost', 20.290501726782033]])

let cells = [b, c, d]
assert(forcifyCells(a, cells, -0.1, -0.2) === -0.10034490322811809)

let cell = new Map()
cell.set('vector', [-3.8490444477891037, 3.845725404968423])
let pushedCell = forcePushCell([[-5, 5], [-5, 5]], cell, 0.1)
console.log("pushedCell vector: " + pushedCell.get('vector'))

cells =
[new Map([['vector', [-1.2160901660749652, -1.4678534070891984]], ['cost', 3.6334689167276046], ['inter', -0.05308703472202883], ['fitness', 3.5803818820055757], ['sumNutrients', 7.597280852362983]]),
 new Map([['vector', [2.6149702254161413, 0.30723092976754074]], ['cost', 6.932460124018773], ['inter', -0.005881006896151689], ['fitness', 6.926579117122621], ['sumNutrients', 6.926579117122621]]),
 new Map([['vector', [-1.3627519818807048, 0.5194513544194524]], ['cost', 2.1269226737279925], ['inter', -0.0746308941528069], ['fitness', 2.0522917795751856], ['sumNutrients', 9.402610813168252]])]

let [best, _] = chemotaxis(cells, [[-5, 5], [-5, 5]], 70, 4, 0.1, 0.1, 0.2, 0.1, 10)
console.log("taxi: " + best.get('vector'))


let theBest = search([[-5, 5], [-5, 5]], 3, 1, 4, 70, 4, 0.1, 0.1, 0.2, 0.1, 10, 0.25)
console.log("Only the very best: " + theBest.get('vector'))
console.log("fitness the very best: " + theBest.get('fitness'))

console.log("done")

/*
"For my ally is the Force, and a powerful ally it is. Life creates it, makes it grow.
Its energy surrounds us and binds us.
Luminous beings are we, not this crude matter.
You must feel the Force around you; here,
between you, me, the tree, the rock, everywhere, yes.
Even between the land ..."
- Yoda
*/
