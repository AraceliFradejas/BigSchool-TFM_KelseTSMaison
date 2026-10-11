# Precios de KelseTS Maison

El catálogo se ha ajustado el 11 de octubre de 2026 a un posicionamiento de boutique de lujo. Los importes son propuestas ficticias en euros para Maison, contrastadas con precios visibles en tiendas oficiales. No representan una venta de productos de esas marcas ni una equivalencia acreditada de materiales o calidad.

Referencias consultadas:

| Categoría | Referencia oficial                                                                                                                                 | Precio observado                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Vestidos  | [Saint Laurent, vestido de satén de seda](https://www.ysl.com/es-es/pr/vestido-con-espalda-descubierta-de-saten-de-seda-838025Y7G279483.html)      | 3.500 €                                                    |
| Bolsos    | [Gucci, selección de bolsos](https://www.gucci.com/es/es/pr/women/handbags/crossbody-bags-for-women/petite-gg-mini-shoulder-bag-p-739722AACAW9022) | Horsebit pequeño: 2.500 €; Dionysus mediano: 2.700–2.900 € |
| Punto     | [Prada, prendas de punto](https://www.prada.com/es/es/womens/ready-to-wear/knitwear/c/10054EU)                                                     | Cárdigan de cachemir y seda: 1.850 €                       |
| Calzado   | [Saint Laurent, bailarinas y mocasines](https://www.ysl.com/en-es/ca/shop-women/shoes/ballerinas)                                                  | Loaferino: 990 €                                           |
| Labiales  | [Gucci, maquillaje de labios](https://www.gucci.com/es/es/st/capsule/beauty-lips-make-up)                                                          | Rouge de Beauté Brillant: 51 €                             |
| Perfumes  | [Gucci Bloom](https://www.gucci.com/es/es/ca/beauty/fragrances/fragrances-for-women/gucci-bloom-c-beauty-fragrances-women-gucci-bloom)             | Eau de Parfum Intense, 50 ml: 124 €                        |

En Maison, los vestidos van de 1.850 a 4.900 €, los bolsos de 1.250 a 2.600 € y el calzado de 890 a 1.450 €. La belleza mantiene una escala propia: maquillaje y bálsamo de 48 a 68 €, perfume de 30 ml a 95 € y de 50 ml a 145 €. Los accesorios de acabado dorado, perlas y cristales son bisutería de diseño; sus precios no implican oro macizo ni piedras preciosas.

Los precios nuevos se aplican directamente al crear una base de datos. Para actualizar una instalación anterior se ejecuta `npm run prices:migrate`. La migración transaccional compara cada variante con su precio original: conserva precios personalizados por Team, existencias, imágenes y líneas e importes de pedidos anteriores. Incrementa la revisión de los productos actualizados para impedir que un formulario Team abierto antes del cambio sobrescriba los nuevos precios. Repetirla no introduce nuevos cambios.

El presupuesto inicial del buscador de looks pasa a 6.500 €; los resultados siguen respetando el presupuesto indicado y el stock disponible.
