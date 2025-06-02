export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

<<<<<<< HEAD
    // helper to convert snake_case to camelCase
    const toCamel = (name) =>
        name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // collect variable and parameter names to rename
    const renameMap = new Map();

    // find variable declarations
=======
    const toCamel = (name) =>
        name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

>>>>>>> b57b4115ddd06de4c5e036274cb7de26c38b655e
    root.find(j.VariableDeclarator).forEach((path) => {
        const varName = path.value.id.name;
        if (/_/.test(varName)) {
            const newName = toCamel(varName);
<<<<<<< HEAD
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
=======

            j(path)
                .find(j.Identifier, { name: varName })
                .replaceWith(j.identifier(newName));

            root.find(j.Identifier, { name: varName }).replaceWith(
                j.identifier(newName),
            );
        }
    });

    root.find(j.FunctionDeclaration).forEach((path) => {
        path.value.params.forEach((param) => {
            if (param.type === "Identifier" && /_/.test(param.name)) {
                const newName = toCamel(param.name);
                root.find(j.Identifier, { name: param.name }).replaceWith(
                    j.identifier(newName),
                );
>>>>>>> b57b4115ddd06de4c5e036274cb7de26c38b655e
            }
        });
    });

<<<<<<< HEAD
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

=======
>>>>>>> b57b4115ddd06de4c5e036274cb7de26c38b655e
    return root.toSource();
}
