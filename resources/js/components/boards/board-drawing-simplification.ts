type StrokePoint = [number, number];

function squaredDistance(first: StrokePoint, second: StrokePoint) {
    return (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
}

function squaredDistanceToSegment(
    point: StrokePoint,
    start: StrokePoint,
    end: StrokePoint,
) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const progress = lengthSquared
        ? Math.max(
              0,
              Math.min(
                  1,
                  ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
                      lengthSquared,
              ),
          )
        : 0;
    return (
        (point[0] - start[0] - progress * dx) ** 2 +
        (point[1] - start[1] - progress * dy) ** 2
    );
}

function reduceNearbyPoints(points: StrokePoint[], toleranceSquared: number) {
    const output = [points[0]];
    let previous = points[0];
    for (let index = 1; index < points.length - 1; index++) {
        if (squaredDistance(points[index], previous) < toleranceSquared)
            continue;
        previous = points[index];
        output.push(previous);
    }
    const endpoint = points[points.length - 1];
    if (squaredDistance(previous, endpoint) > 0) output.push(endpoint);
    return output;
}

export function simplifyBoardDrawingPoints(
    points: StrokePoint[],
    tolerance: number,
): StrokePoint[] {
    if (points.length < 3 || tolerance <= 0) return points;
    const toleranceSquared = tolerance * tolerance;
    const source = reduceNearbyPoints(points, toleranceSquared / 4);
    if (source.length < 3) return source;
    const retained = new Uint8Array(source.length);
    retained[0] = 1;
    retained[source.length - 1] = 1;
    const sections: [number, number][] = [[0, source.length - 1]];
    let remainingComparisons = source.length * 24;
    while (sections.length) {
        const [first, last] = sections.pop()!;
        const interiorCount = last - first - 1;
        if (interiorCount <= 0) continue;
        //
        // Pathological zigzags must not make live cleanup quadratic; preserve detail when the per-frame work budget is exhausted.
        //
        if (interiorCount > remainingComparisons) {
            retained.fill(1, first + 1, last);
            continue;
        }
        remainingComparisons -= interiorCount;
        let furthestDistance = toleranceSquared;
        let furthestIndex = -1;
        for (let index = first + 1; index < last; index++) {
            const distance = squaredDistanceToSegment(
                source[index],
                source[first],
                source[last],
            );
            if (distance > furthestDistance) {
                furthestDistance = distance;
                furthestIndex = index;
            }
        }
        if (furthestIndex < 0) continue;
        retained[furthestIndex] = 1;
        sections.push([first, furthestIndex], [furthestIndex, last]);
    }
    return source.filter((_, index) => retained[index] === 1);
}
