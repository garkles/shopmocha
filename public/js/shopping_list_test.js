describe("ShoppingListItem", function () {

    it("ShoppingListItem is a class", function () {
        expect(ShoppingListItem).to.be.a("function");
    });

    it("ShoppingListItem has a property named name", function () {
        var item = new ShoppingListItem("Avocado", "Eat immediately.");

        expect(item).to.have.property("name");
    });

    it("ShoppingListItem has a property named description", function () {
        var item = new ShoppingListItem("Avocado", "Eat immediately.");

        expect(item).to.have.property("description");
    });

    it("ShoppingListItem has a property named is_done", function () {
        var item = new ShoppingListItem("Avocado", "Eat immediately.");

        expect(item).to.have.property("is_done");
    });

    it("constructor accepts name and description", function () {
        var item = new ShoppingListItem(
            "Avocado",
            "Must be eaten immediately."
        );

        expect(item.name).to.equal("Avocado");
        expect(item.description).to.equal(
            "Must be eaten immediately."
        );
    });

    it("new ShoppingListItem is initially not done", function () {
        var item = new ShoppingListItem(
            "Avocado",
            "Must be eaten immediately."
        );

        expect(item.is_done).to.equal(false);
    });

    it("check sets is_done to true", function () {
        var item = new ShoppingListItem(
            "Avocado",
            "Must be eaten immediately."
        );

        item.check();

        expect(item.is_done).to.equal(true);
    });

    it("uncheck sets is_done to false", function () {
        var item = new ShoppingListItem(
            "Avocado",
            "Must be eaten immediately."
        );

        item.check();
        item.uncheck();

        expect(item.is_done).to.equal(false);
    });

    it("render returns the correct HTML", function () {
        var item = new ShoppingListItem(
            "Avocado",
            "Must be eaten immediately."
        );

        expect(item.render(0)).to.equal(
            '<li class="completed_false">' +
            '<input type="checkbox" ' +
            'onchange="changeCheckedStatus(0, this)">' +
            '<span>Avocado</span> ' +
            '<span>Must be eaten immediately.</span> ' +
            '<button onclick="removeItemButtonClicked(0)">x</button>' +
            '</li>'
        );
    });

});


describe("ShoppingList", function () {

    it("ShoppingList is a class", function () {
        expect(ShoppingList).to.be.a("function");
    });

    it("ShoppingList has an items property", function () {
        var shopping_list = new ShoppingList();

        expect(shopping_list).to.have.property("items");
    });

    it("constructor initializes items as an empty array", function () {
        var shopping_list = new ShoppingList();

        expect(shopping_list.items).to.be.an("array");
        expect(shopping_list.items).to.be.empty;
    });

    it("addItem adds a ShoppingListItem", function () {
        var shopping_list = new ShoppingList();

        var item = new ShoppingListItem(
            "Avocado",
            "Eat immediately."
        );

        shopping_list.addItem(item);

        expect(shopping_list.items).to.include(item);
    });

    it("addItem throws an error for invalid objects", function () {
        var shopping_list = new ShoppingList();

        expect(function () {
            shopping_list.addItem("Avocado");
        }).to.throw();
    });

    it("removeItem removes an existing ShoppingListItem", function () {
        var shopping_list = new ShoppingList();

        var item = new ShoppingListItem(
            "Avocado",
            "Eat immediately."
        );

        shopping_list.addItem(item);
        shopping_list.removeItem(item);

        expect(shopping_list.items).to.not.include(item);
    });

    it("removeItem with no parameter removes the last item", function () {
        var shopping_list = new ShoppingList();

        var item1 = new ShoppingListItem("Apple", "Red");
        var item2 = new ShoppingListItem("Avocado", "Green");

        shopping_list.addItem(item1);
        shopping_list.addItem(item2);

        shopping_list.removeItem();

        expect(shopping_list.items).to.deep.equal([item1]);
    });

    it("removeItem with no parameter does nothing on an empty list", function () {
        var shopping_list = new ShoppingList();

        shopping_list.removeItem();

        expect(shopping_list.items).to.be.empty;
    });

    it("removeItem throws an error for an invalid object", function () {
        var shopping_list = new ShoppingList();

        var item = new ShoppingListItem(
            "Avocado",
            "Eat immediately."
        );

        shopping_list.addItem(item);

        expect(function () {
            shopping_list.removeItem("Avocado");
        }).to.throw();
    });

    it("removeItem throws an error when item does not exist", function () {
        var shopping_list = new ShoppingList();

        var item1 = new ShoppingListItem("Apple", "Red");
        var item2 = new ShoppingListItem("Avocado", "Green");

        shopping_list.addItem(item1);

        expect(function () {
            shopping_list.removeItem(item2);
        }).to.throw();
    });

    it("render returns a list containing all items", function () {
        var shopping_list = new ShoppingList();

        var item1 = new ShoppingListItem(
            "Apple",
            "Red"
        );

        var item2 = new ShoppingListItem(
            "Avocado",
            "Green"
        );

        shopping_list.addItem(item1);
        shopping_list.addItem(item2);

        var output = shopping_list.render();

        expect(output).to.contain("<ul>");
        expect(output).to.contain("</ul>");
        expect(output).to.contain("Apple");
        expect(output).to.contain("Avocado");
    });

});