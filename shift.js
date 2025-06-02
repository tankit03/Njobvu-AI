export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const toCamel = (name) =>
        name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    root.find(j.VariableDeclarator).forEach((path) => {
        const varName = path.value.id.name;
        if (/_/.test(varName)) {
            const newName = toCamel(varName);

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
            }
        });
    });

    return root.toSource();
}
