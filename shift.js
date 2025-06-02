export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // helper to convert snake_case to camelCase
    const toCamel = (name) =>
        name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // collect variable and parameter names to rename
    const renameMap = new Map();

    // find variable declarations
    root.find(j.VariableDeclarator).forEach((path) => {
        const varName = path.value.id.name;
        if (/_/.test(varName)) {
            const newName = toCamel(varName);
            renameMap.set(varName, newName);
            path.get("id").replace(j.identifier(newName));
        }
    });

    // find function parameters
    root.find(j.Function).forEach((path) => {
        path.value.params.forEach((param) => {
            if (param.type === "Identifier" && /_/.test(param.name)) {
                const newName = toCamel(param.name);
                renameMap.set(param.name, newName);
                param.name = newName;
            }
        });
    });

    // replace references to renamed variables
    root.find(j.Identifier).forEach((path) => {
        const name = path.value.name;

        if (renameMap.has(name)) {
            const parent = path.parent.value;
            const isPropertyOfMemberExpression =
                parent.type === "MemberExpression" &&
                parent.property === path.value;

            if (!isPropertyOfMemberExpression) {
                path.value.name = renameMap.get(name);
            }
        }
    });

    return root.toSource();
}
