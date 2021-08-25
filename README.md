# CalculatingProductPriceUsingJavaScript

## My manager asked me calculating the final price of 30k+ products by their pricing rules. So I wrote this JS code logic and finished the task with out.csv file.

run npm install to load dependencies before run node index.js

Target price calculation

The competitors: Competitor 1-8(names disclosed).

Suppliers: Supplier 1-8(names disclosed)

Products: all products names and vendercodes disclosed

Rules:
1.Generally match the lowest price in the competitors specified except:
a.If the lowest price is X% (or $Y, whichever is smaller) lower than second lowest price, then use second lowest price timed by 0.99 as the target price
Our Company price range | X% | $Y
------------------------|----|----
Greater than $1500| 2% | 50
$800-$1500 | 3% | 30
$500 to $800 | 3% | 18
$300 to $500 | 4% | 15
$100 to $300 | 7% | 10
<=$100 | 10%| 8

b.There are 4 scenarios of stock availability in price comparison:
i.OurCompany has stock competitor has stock
ii.OurCompany has stock competitor has no stock
iii.OurCompany has no stock competitor has stock
iv.OurCompany has no stock competitor has no stock

The rule 1a applies to 1b1), 1b3) and 1b4) above.

c.In the event of 1b2), OurCompany has stock and the cheapest competitor has no stock, then we exclude that the cheapest no stock competitor, move to the second cheapest competitor.
If the second cheapest competitor has no stock, then we exclude the second cheapest competitor to use the next cheapest competitor, with same method, till we get the cheapest competitors’ with stock.

2.For the items which only be listed in one of the competitors, please do the followings according to scenarios below respectively:
i.OurCompany has stock competitor has stock
ii.OurCompany has stock competitor has no stock
iii.OurCompany has no stock competitor has stock
iv.OurCompany has no stock competitor has no stock

b.In scenarios 3i), 3iii) & 3iv), if margin is more than 5%, then match it.
c.In scenarios 3i), 3iii) & 3iv), if margin is less than 5%, ask manager to manually check
d.In scenario 3ii), we make 15% margin

3.For the items which could not be linked from the list of any competitor, Please do the followings:
a.Please check the products on google and staticice again. If there is/are a competitor(s), please check the link to ensure the products to be linked.
b.If there is no such product in any of the competitors, then check with purchasing to get the current cost.
c.After checking, if there is no any competitor for the items CPL listed, then use lowest replacement cost and add 20% margin as target price
d.Produce a list of products that cannot be linked with any of our competitors to the management
