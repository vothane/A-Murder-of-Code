function dist(a, b) {
    return a.map((x, i) => Math.abs(x - b[i]) ** 2)
            .reduce((sum, now) => sum + now)
        ** (1 / 2)
}

function cost(permutation, points) {
    let distance = 0
    permutation.map(
        (p1, i) =>
        {
            let p2 = (i === permutation.length - 1) ? permutation[0] : permutation[i + 1]
            distance += dist(points[p1], points[p2])
        })
    return distance
}

function permutate(points) {
    let permutation = Array.from(Array(points.length).keys())
    return permutation.sort(() => Math.random() - 0.5)
}

function pheromoneMatrix(numPoints, naiveScore) {
    let v = numPoints / naiveScore
    return Array.from(Array(numPoints), () => Array(numPoints).fill(v))
}

function buildChoices(points, lastPoint, exclude, pheromone, pt_heur, pt_hist) {
    let choices = new Array()

    points.forEach(
        (pt, i) =>
        {
            if (! exclude.includes(i)) {
                let prob = new Map()
                prob.set('point', i)
                prob.set('history', pheromone[lastPoint][i] ** pt_hist)
                prob.set('distance', dist(points[lastPoint], pt))
                prob.set('heuristic', (1.0 / prob.get('distance')) ** pt_heur)
                prob.set('prob', prob.get('history') * prob.get('heuristic'))
                choices.push(prob)
            }
        }
    )
    return choices
}

function nextPoint(choices) {
    let sum = choices.reduce((sum, choice) => sum + choice.get('prob'), 0.0)
    if (sum === 0.0) return choices[Math.floor(Math.random()*choices.length)].get('point')
    let idx = choices.findIndex(
        (choice) => {
            let v = Math.random()
            v -= choice.get('prob') / sum
            return v <= 0.0
        })
    if (idx !== -1) return choices[idx].get('point')
    return choices[choices.length - 1].get('point')
}

function step(points, pher, pt_heur, pt_hist) {
    let perm = new Array()
    perm.push(Math.floor(Math.random()*points.length))

    do {
        let choices = buildChoices(points, [...perm].pop(), perm, pher, pt_heur, pt_hist)
        let nextPt = nextPoint(choices)
        perm.push(nextPt)
    } while (perm.length < points.length)

    return perm
}

function pherDecay(pheromone, factor) {
    return pheromone.map((row) => row.map((el) => (1.0 - factor) * el))
}

function updatePher(pheromone, solutions) {
    solutions.forEach(
        (solution) =>
            solution.get('vector').forEach(
                (x, i) =>
                {
                    let y = i == (solution.get('vector').length-1) ? solution.get('vector')[0] : solution.get('vector')[i+1]
                    pheromone[x][y] += (1.0 / solution.get('cost'))
                    pheromone[y][x] += (1.0 / solution.get('cost'))
                }))
    return pheromone
}


function search(points, epochs, numAnts, factor, pt_heur, pt_hist) {
    let best = new Map()
    best.set('vector', permutate(points))
    best.set('cost', cost(best.get('vector'), points))
    let pheromone = pheromoneMatrix(points.length, best.get('cost'))

    for (epoch = 0; epoch <= epochs; epoch++) {
        let solutions = []
        for (ant = 0; ant <= numAnts; ant++) {
            let candidate = new Map()
            candidate.set('vector', step(points, pheromone, pt_heur, pt_hist))
            candidate.set('cost', cost(candidate.get('vector'), points))
            if (candidate.get('cost') < best.get('cost')) best = candidate
            solutions.push(candidate)
        }
        pheromone = pherDecay(pheromone, factor)
        pheromone = updatePher(pheromone, solutions)
    }
    return best
}

const assert = function(condition, message) {
    if (!condition)
        throw Error('Assert failed: ' + (message || ''))
}

let distance = dist([1740, 245], [565, 575])
assert(Math.round(distance) === 1220, "Euclidean distance")

let permutations = [4, 0, 1, 3, 2]
let points =
    [[565,575],[25,185],[345,750],[945,685],[845,655],
        [880,660],[25,230],[525,1000],[580,1175],[650,1130],[1605,620],
        [1220,580],[1465,200],[1530,5],[845,680],[725,370],[145,665],
        [415,635],[510,875],[560,365],[300,465],[520,585],[480,415],
        [835,625],[975,580],[1215,245],[1320,315],[1250,400],[660,180],
        [410,250],[420,555],[575,665],[1150,1160],[700,580],[685,595],
        [685,610],[770,610],[795,645],[720,635],[760,650],[475,960],
        [95,260],[875,920],[700,500],[555,815],[830,485],[1170,65],
        [830,610],[605,625],[595,360],[1340,725],[1740,245]]

let cst = cost(permutations, points)
assert(Math.round(cst) === 3117, "cost")

// eye test
//console.log(pheromoneMatrix(5, 3178))

// eye test
//console.log(buildChoices(points, 0, [0], pheromoneMatrix(5, 3178), 2.5, 1.0))

let a = new Map([['point', 0], ['history', 0.0021079258010118043], ['distance', 396], ['heuristic', 3.204512981007079e-07], ['prob', 6.754875592342073e-10]])
let b = new Map([['point', 1], ['history', 0.0021079258010118043], ['distance', 1047], ['heuristic', 2.819248096008211e-08], ['prob', 5.942765801029112e-11]])
let c = new Map([['point', 2], ['history', 0.0021079258010118043], ['distance', 604], ['heuristic', 1.11534096472079e-07], ['prob', 2.35105599646035e-10]])
let d = new Map([['point', 3], ['history', 0.0021079258010118043], ['distance', 104], ['heuristic', 9.066019560751852e-06], ['prob', 2.9650343633819905e-10]])

let choices = [a, b, c, d]
//console.log(nextPoint(choices))

let pherMatrix = Array.from(Array(5), () => Array(5).fill(0.0016))

// eye test
//console.log(step(points, pherMatrix, 2.5, 1.0))

// eye test all elements should = 0.0025
// pherMat = pherDecay(pheromoneMatrix(5, 1000), 0.5)
// console.log(pherMat)
//
// let solutions = new Array(30).fill(new Map())
// solutions.map(
//     (solution) =>
//     {
//         solution.set('vector', [0,1,2,3,4].sort(() => Math.random() - 0.5))
//         solution.set('cost', 2000)
//     })
// console.log(updatePher(pherMat, solutions))
let best = search(points, 50, 30, 0.6, 2.5, 1.0)
console.log("vector: " + best.get('vector') + " cost: " + best.get('cost'))
console.log("Doesn't obtain most optimal solution, somewhere in upper tier 90%. However my python impl does, blaming js.")
