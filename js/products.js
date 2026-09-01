import { supabase } from "./supabase.js";

export async function loadProducts(category, containerId) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container '${containerId}' not found.`);
        return;
    }

    container.innerHTML = "<p>Loading products...</p>";

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

    console.log(data);

    if (error) {
        console.error(error);
        container.innerHTML = "<p>Failed to load products.</p>";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<p>No ${category} products available.</p>`;
        return;
    }

    container.innerHTML = "";

    data.forEach(product => {

        container.innerHTML += `
            <div class="product-card">

                <div class="product-img-box">

                    ${product.brand ? `<span class="badge">${product.brand}</span>` : ""}

                    <img
                        src="${product.image_url}"
                        alt="${product.name}"
                        class="dashboard-img">

                    <a
                        href="https://api.whatsapp.com/send?phone=2349032107622"
                        class="add-to-cart-overlay">
                        Order via WhatsApp
                    </a>

                </div>

                <div class="product-details">

                    <h3>${product.name}</h3>

                    <span class="price">
                        ₦${Number(product.price).toLocaleString()}
                    </span>

                    <p>${product.description}</p>

                </div>

            </div>
        `;

    });

}