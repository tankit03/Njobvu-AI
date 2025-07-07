export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const toCamel = (name) =>
        name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    const renameMap = new Map();

    // Handle variable declarations (var, let, const)
    root.find(j.VariableDeclarator).forEach((path) => {
        const varName = path.value.id.name;
        if (/_/.test(varName)) {
            const newName = toCamel(varName);
            renameMap.set(varName, newName);
            path.get("id").replace(j.identifier(newName));
        }
    });

    // Handle function parameters
    root.find(j.Function).forEach((path) => {
        path.value.params.forEach((param) => {
            if (param.type === "Identifier" && /_/.test(param.name)) {
                const newName = toCamel(param.name);
                renameMap.set(param.name, newName);
                param.name = newName;
            }
        });
    });

    // Handle assignments **without** declarations (globals)
    root.find(j.AssignmentExpression).forEach((path) => {
        const left = path.value.left;

        if (
            left.type === "Identifier" &&
            /_/.test(left.name) &&
            !renameMap.has(left.name)
        ) {
            const newName = toCamel(left.name);
            renameMap.set(left.name, newName);
            left.name = newName;
        }
    });

    // Replace all standalone references (but not object properties!)
    root.find(j.Identifier).forEach((path) => {
        const name = path.value.name;

        const parent = path.parent.value;
        const isPropertyOfMemberExpression =
            parent.type === "MemberExpression" &&
            parent.property === path.value;

        if (renameMap.has(name) && !isPropertyOfMemberExpression) {
            path.value.name = renameMap.get(name);
        }
    });

    return root.toSource();
}
