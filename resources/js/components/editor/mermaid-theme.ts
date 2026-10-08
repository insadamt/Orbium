const textColor = '#27272a';
const nodeColor = '#f4f4f5';
const secondaryColor = '#e4e4e7';
const groupColor = '#fafafa';
const borderColor = '#a1a1aa';
const lineColor = '#71717a';
const surfaceColor = '#ffffff';
const chartColors = [
    nodeColor,
    secondaryColor,
    '#d4d4d8',
    '#c4c4cc',
    borderColor,
    groupColor,
];

export function createMermaidThemeVariables() {
    const variables: Record<string, unknown> = {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '15px',
        radius: 8,
        strokeWidth: 1.25,
        useGradient: false,
        dropShadow: 'none',
        primaryColor: nodeColor,
        secondaryColor,
        tertiaryColor: groupColor,
        background: surfaceColor,
        mainBkg: nodeColor,
        nodeBkg: nodeColor,
        clusterBkg: groupColor,
        clusterBorder: '#d4d4d8',
        edgeLabelBackground: surfaceColor,
        noteBkgColor: nodeColor,
        noteBorderColor: '#d4d4d8',
        actorBkg: nodeColor,
        activationBkgColor: secondaryColor,
        labelBoxBkgColor: nodeColor,
        sequenceNumberColor: surfaceColor,
        rowOdd: nodeColor,
        rowEven: secondaryColor,
        attributeBackgroundColorOdd: nodeColor,
        attributeBackgroundColorEven: secondaryColor,
        pieOpacity: 1,
        pieStrokeWidth: '1px',
        pieOuterStrokeWidth: '1px',
        pieTitleTextSize: '18px',
        pieSectionTextSize: '15px',
        pieLegendTextSize: '15px',
        tagLabelFontSize: '13px',
        commitLabelFontSize: '13px',
        critBkgColor: secondaryColor,
        critBorderColor: lineColor,
        archEdgeWidth: '1.5',
        archGroupBorderWidth: '1px',
        xyChart: {
            backgroundColor: surfaceColor,
            titleColor: textColor,
            dataLabelColor: textColor,
            legendTextColor: textColor,
            xAxisTitleColor: textColor,
            xAxisLabelColor: textColor,
            xAxisTickColor: lineColor,
            xAxisLineColor: lineColor,
            yAxisTitleColor: textColor,
            yAxisLabelColor: textColor,
            yAxisTickColor: lineColor,
            yAxisLineColor: lineColor,
            plotColorPalette: chartColors.join(','),
        },
        radar: {
            axisColor: lineColor,
            graticuleColor: borderColor,
            curveOpacity: 0.5,
        },
        cynefin: {
            textColor,
            labelColor: textColor,
            complexBg: nodeColor,
            complicatedBg: secondaryColor,
            chaoticBg: groupColor,
            clearBg: nodeColor,
            confusionBg: secondaryColor,
            boundaryColor: lineColor,
            arrowColor: lineColor,
            cliffColor: lineColor,
        },
    };
    for (const name of [
        'primaryTextColor',
        'secondaryTextColor',
        'tertiaryTextColor',
        'textColor',
        'nodeTextColor',
        'titleColor',
        'noteTextColor',
        'actorTextColor',
        'signalTextColor',
        'labelTextColor',
        'loopTextColor',
        'classText',
        'stateLabelColor',
        'transitionLabelColor',
        'taskTextColor',
        'taskTextOutsideColor',
        'taskTextLightColor',
        'taskTextDarkColor',
        'taskTextClickableColor',
        'scaleLabelColor',
        'pieTitleTextColor',
        'pieSectionTextColor',
        'pieLegendTextColor',
        'vennTitleTextColor',
        'vennSetTextColor',
        'requirementTextColor',
        'relationLabelColor',
        'branchLabelColor',
        'tagLabelColor',
        'commitLabelColor',
        'errorTextColor',
        'quadrantPointTextFill',
        'quadrantXAxisTextFill',
        'quadrantYAxisTextFill',
        'quadrantTitleFill',
    ])
        variables[name] = textColor;
    for (const name of [
        'primaryBorderColor',
        'secondaryBorderColor',
        'tertiaryBorderColor',
        'nodeBorder',
        'actorBorder',
        'actorLineColor',
        'labelBoxBorderColor',
        'activationBorderColor',
        'taskBorderColor',
        'activeTaskBorderColor',
        'doneTaskBorderColor',
        'personBorder',
        'compositeBorder',
        'pieStrokeColor',
        'pieOuterStrokeColor',
        'requirementBorderColor',
        'tagLabelBorder',
        'archGroupBorderColor',
        'gridColor',
        'quadrantInternalBorderStrokeFill',
        'quadrantExternalBorderStrokeFill',
        'emUiStroke',
        'emProcessorStroke',
        'emReadModelStroke',
        'emCommandStroke',
        'emEventStroke',
        'emSwimlaneBackgroundStroke',
    ])
        variables[name] = borderColor;
    for (const name of [
        'lineColor',
        'arrowheadColor',
        'defaultLinkColor',
        'signalColor',
        'transitionColor',
        'relationColor',
        'archEdgeColor',
        'archEdgeArrowColor',
        'emArrowhead',
        'emRelationStroke',
        'todayLineColor',
        'vertLineColor',
    ])
        variables[name] = lineColor;
    for (const name of [
        'rectBkgColor',
        'sectionBkgColor',
        'altSectionBkgColor',
        'sectionBkgColor2',
        'excludeBkgColor',
        'taskBkgColor',
        'activeTaskBkgColor',
        'doneTaskBkgColor',
        'personBkg',
        'stateBkg',
        'labelBackgroundColor',
        'compositeBackground',
        'altBackground',
        'compositeTitleBackground',
        'requirementBackground',
        'relationLabelBackground',
        'tagLabelBackground',
        'commitLabelBackground',
        'errorBkgColor',
        'emUiFill',
        'emProcessorFill',
        'emReadModelFill',
        'emCommandFill',
        'emEventFill',
        'emSwimlaneBackgroundOdd',
    ])
        variables[name] = nodeColor;
    for (let index = 0; index < 12; index++) {
        const color = chartColors[index % chartColors.length];
        variables[`cScale${index}`] = color;
        variables[`cScalePeer${index}`] = color;
        variables[`cScaleInv${index}`] = textColor;
        variables[`cScaleLabel${index}`] = textColor;
        variables[`pie${index + 1}`] = color;
        if (index < 8) {
            variables[`git${index}`] = color;
            variables[`gitInv${index}`] = textColor;
            variables[`gitBranchLabel${index}`] = textColor;
            variables[`fillType${index}`] = color;
            variables[`venn${index + 1}`] = color;
        }
        if (index < 5) {
            variables[`surface${index}`] = nodeColor;
            variables[`surfacePeer${index}`] = secondaryColor;
        }
        if (index < 4) {
            variables[`quadrant${index + 1}Fill`] =
                index % 2 ? secondaryColor : nodeColor;
            variables[`quadrant${index + 1}TextFill`] = textColor;
        }
    }
    return variables;
}

export function createMermaidC4Config() {
    const colors: Record<string, string> = {};
    for (const kind of [
        'person',
        'system',
        'system_db',
        'system_queue',
        'container',
        'container_db',
        'container_queue',
        'component',
        'component_db',
        'component_queue',
    ]) {
        for (const prefix of ['', 'external_']) {
            colors[`${prefix}${kind}_bg_color`] = nodeColor;
            colors[`${prefix}${kind}_border_color`] = borderColor;
        }
    }
    return { wrap: true, ...colors };
}
