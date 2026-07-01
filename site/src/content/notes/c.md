---
# Manual metadata: safe to edit. The importer preserves these fields unless run with --force.
title: "C"
slug: "c"
topic: "c-cpp"
tags: ["c","systems-programming","basics"]
summary: "Introductory C notes covering the language model, program structure, variables, printf, operators, control flow, functions, pointers, and foundational syntax."
pinned: true
order: 10

# Generated import boundary: importer-owned. Edit only when repairing import state.
sourceType: "html"
sourcePath: "src/content/html-notes/c.html"
createdAt: "2026-06-30"
updatedAt: "2026-07-01"
generated:
  importer: "notion-html"
  sourceFile: "imports/fidelity-test/html/C e68a50627edb4ab491035244e389b9dd.html"
  sourceId: "e68a50627edb4ab491035244e389b9dd"
  sourceHash: "87480e1bd6dca846e95d8b53d0c00f6a30757616cb92a1706a34139ed60c5bb2"
  importedAt: "2026-07-01T03:10:58.004Z"
---
### Introduction

- C is a **statically** typed language
- Statically typed: languages that have the type of the variable are known at the compile time rather than runtime.
- C has no **type safety**
- Type safety: languages that control and ensure that any variable access only its authorized memory locations in a well-defined and permissible way
- C has no **garbage collector**
- Garbage collector: memory management system which automatically finds and removes objects that are no longer being used
- C is known for its **speed, efficiency ,hardware manipulation capabilities and relative ease of shooting yourself in the foot**
- C is used game development, robotics etc.

 ****

### Workflow

Computer

> Image from raw Notion export omitted until the asset-import phase.

User

> Image from raw Notion export omitted until the asset-import phase.

### Basic Structure of the Code

```c
#include <stdio.h> //standard input/output
#include <stdlib.h> //standard library

int main(void){
/* code */
return 0; //after successful completion of the program the "main" function returns 0
}
```

- First two lines of code initiates the program by importing the required libraries using the **include** keyword
- The default starting point of the program is the **main** function, the **int** and **void** keywords are respectively the the output and the input types required by the main function, what are functions you ask? well we will discuss that in the next section - please bear with me for now
- After successful execution of the code the **return** keyword “returns” a value of 0 signifying the successful completion of the code. In case of an error return “returns” a non-zero value
- Ending the line with “ **;** ” should always be kept in mind

### The Basics

**Hello World**

The **printf** statement prints the value in terminal, similar to **echo, print , cout** etc. 

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
		printf("Hello World!");
return 0; 
}
```

Compiling and running the code produces the following result: 

> Image from raw Notion export omitted until the asset-import phase.

Now let us see variations of the above code to understand how the **printf** statement works:

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
		printf("Hello");
		printf(" World!");
return 0; 
}
```

Intrestingly this code outputs the same result, this shows us that in C the **printf** works squentially and dosent enters a new line with each subsequent printfs’ , then how do we enter a new line? 

This can be achieved by thr **\n** tag:

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
		printf("Hello\n");
		printf("World!");
return 0; 
}
```

> Image from raw Notion export omitted until the asset-import phase.

The code switches to a new line when it encounters the **\n** tag, there are many more tag like this such as **\t , \b , \\**  for tab, backspace and slash repectively 

**Variables**

Variables are variables - study asome algebra if you dont know what a variable is. When in C as with most other languages we are required to type define each variable at the time of declaration. As mention earlier C is a **statically typed language** hence the type of each variable is known at the compile time

There are various types of variable each which a specific use:

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
		char name1 = '*';
		int name2 = 3;
		long name3 = 999999999;
		float name4 = 3.141592;
		double name5 = 999999.999999;
		
return 0; 
}
```

This is not an exhaustive list of all variable types , however this list should be sufficient for the most part

1. **char:** char or character are 1 byte long, used to contain letters or special characters (one byte is 8 bit as in 8 on/off switches in binary)
2. **int:** int or interger are 4 bytes long, used to contain integer values - it can hold maximum value of **2^32 -1 = 4294967295** and for signed we need to allot one bit to represent the sign hence the maximum does down to **2^31 -1 = 2147483647** 
3. **long:** long is an extension of int to store larger values and are 4 bytes and 8 bytes long in 32-bit and 64-bit system respectively
4. **float:** float or floating point type is used to store decimal values, which are 4 bytes long
5. **double:** double is the long version of float, 8 bytes long

So these were the basic types of the variables!

---

> An Important thing to note is that C converts one type of variable into another when called via by some other format, for example if we initialize a variable as float : *float* name = 3.141592; and try to output it using printf as an *int* we get the following result 👉

Why did we get 0?
> 

> Image from raw Notion export omitted until the asset-import phase.

> Image from raw Notion export omitted until the asset-import phase.

> Now what would we get if we tried to ouput it as *double*? will we get 0 again? 

We got 3.141592 as the result what does it say about the output give by C?
> 

---

### Format Specifiers

Used to specify a data type 
It is initiated by the % - you can think of it as a placeholder for whatever you want , input or output. Every variable type has it own flag.

```c
#include <stdio.h>

int main(void) {
    
    int age = 25;
    float price = 19.99;
    double pi = 3.1415926535;
    char currency = '$';
    char name[] = "Bro Code";
     
    printf("%d\n", age);
    printf("%f\n", price);
    printf("%lf\n", pi);
    printf("%c\n", currency);
    printf("%s\n", name);

    return 0;
}
```

> Image from raw Notion export omitted until the asset-import phase.

**Modifiers**

```c
#include <stdio.h>

int main(void) {
    
    float num2 = 19.99;
    int num1 = -100;

    printf("%d\n", num1);
    printf("%4d\n", num1); /*characters in output*/
    printf("%-4d\n", num1);/*spaces on the right most*/
    printf("%04d\n", num1);/*replaces spaces by 0*/
    printf("%+4d\n", num1);/*displays +ve/-ve numbers*/
    printf("%.2f\n", num2);/*places after decimal*/
    

    return 0;
}
```

### User Input

Here we will learn how to take input from our user and deal with different scenarios relating to the various types of variables

Let us breakdown this code bit by bit
The first thing you might notice is the inclusion of a new library **string.h**, for now just know that it helps us deal with pesky scenarios relating to strings

Best practice is to always use a variable only after assigning it a value to avoid any unpredictable behavior. this can occur due to the variable being assigned storage which has some left over data from some other program on the machine - hence I initiated the variable with nil values

Now the interesting **scanf** function: It takes the user input of the defined variable type. The **&** specifies the address of the variable .One thing to pay attention to is the space before the %c in grade input , this is avoid taking in the \n of the previous command acting as an input buffer.

Finally we get to the name input- this can get a little complicated. The reason why we use the **fgets** function instead of  the scanf function is due to the fact that scanf stops reading after spaces so we wont be able to take in our user’s full names

The **getchar()** functions acts the space in the scanf function (basically an input buffer)

name[strlen(name) - 1] = '\0' 👈 this whole thing is just to take in “abc def” instead of “abc def\n” as fgets adds \n for enter key we press, This is also where we use the **string.h** library

```c
#include <stdio.h>
#include <string.h>
int main(void){

    int age = 0;
    float gpa = 0.0f;
    char grade='\0';
    char name[30] = "";

    printf("Enter your age: ");
    scanf("%d", &age);

    printf("Enter your GPA: ");
    scanf("%f", &gpa);

    printf("Enter your grade: ");
    scanf(" %c", &grade);

    printf("Enter your full name: ");
    getchar();
    fgets(name, sizeof(name), stdin);
    name[strlen(name) - 1] = '\0';

    printf("\n");
    printf("%s\n", name);
    printf("%d\n", age);
    printf("%.2f\n", gpa);
    printf("%c\n", grade);

    return 0;
}
```

> [!tip]
> One very important thing to keep in mind is that to use the getchar() only when the string has preceding inputs from the user else it will skip the first character the user inputs

 

### Operators

**Arithmetic Operators 🔢**

1. Addition (+) 
2. Subtraction (-) 
3. Multiplication (*)
4. Division (/) 
5. Modulo (%)

Let’s see them in action 👇

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
    float num1 = 29.00;
    float num2 = 11.00;
    printf("Addition: %f\n", num1 + num2);
    printf("Subtraction: %f\n", num1 - num2);
    printf("Multiplication: %f\n", num1 * num2);
    printf("Division: %f\n", num1 / num2);
    printf("Modulus: %d\n", (int)num1 % (int)num2); 
    return 0; 
}
```

Ok quite a few things to discuss here, let’s over them one by one 

‘**+**’,’**-**’,’*****’,’**/**’ work as expected no surprises there but you might have noticed “**%f\n**” tag in all but one **printf** statements, these are placeholders for the variable you want to output. The **%f** specifies the variable type to be inserted there and as mentioned earlier **\n** just enters a new line

For the uninformed the ‘%’ or the modulo operator returns the remainder when a is divided by b in a%b

> Image from raw Notion export omitted until the asset-import phase.

Now for the modulo operator the following has been given:
(int)num1 % (int)num2 ; the (int) is used to convert the variable type of num1 and num2 to int type because the modulo operator only accepts integer values

Now in the execution terminal I have introduced a new keyword **time** , to be honest this has got nothing to do with and you can perfectly do away with just **./*.exe** but I like to know how well my code is performing hence the usage.

---

**Relational Operators** 

1. ==
2. !=
3. >,<,>=,<=

I guess this is pretty much self explanatory so I am just skip this
Well one thing I would like to address is why 2 =’s ? Well the answer is really simple the developers in the earlier days had already used up the single ‘=’ for assignment of values hence we had to use ‘==’

---

**Logical Operators**

1. AND (&&) : Returns true/1 if both the conditions are true 
2. OR (||) : Returns true/1 when either of the conditions are true
3. NOT (!) : Returns true/1 when the condition is fault

Again pretty self-explanatory 

---

**Bitwise Operator**

1. AND (&)
2. OR (|)
3. XOR (^)
4. NOT (~)
5. LHS/RHS (<<,>>)

```c
#include <stdio.h> 
#include <stdlib.h>

int main(void){
    int num1 = 29.00; //binary 11101
    int num2 = 11.00; //binary 1011
    printf("%d\n", num1 & num2); //binary 1001
    printf("%d\n", num1 | num2); //binary 11111
    printf("%d\n", num1 ^ num2); //binary 11010
    printf("%d\n", ~num1); //binary -11010
    printf("%d\n", ~num2); //binary -11011
    printf("%d\n", num1 << 2); //binary 1110100
    printf("%d\n", num1 >> 2); //binary 111
    return 0; 
}
```

Bitwise operations are performed on the binary base of the input , let’s go over them on by one:

**&** is the binary AND it returns 1 only when both the inputs are 1 and 0 other wise, in other words A & B → A * B in binary.

‘**|**’ is the binary OR which returns when either of the input is 1 , 0 otherwise, in other words A | B → A + B in binary

> Image from raw Notion export omitted until the asset-import phase.

**^** is the binary exclusive OR returns 1 only when one and only one of the input is 1, returns 0 otherwise

**~** is the binary NOT, it flips the digits , why do you think ~ of 29 is -30 and not 226? I will answer that later ! 

**<<**,**>>** are Left hand shifts and Right hand shifts respectively ,  they shift each bit of a given input a unit left or right add an integer after it specifies how many times the operation has to be preformed. Interestingly a neat equivalence can be drawn from the these operators — LHS is equivalent to multiplication by 2 and RHS is equivalent to division by 2 . Think about it, shifting place in binary is just shifting to another power of 2

But another detail you might notice the command: 29 << 2 results in 7 not 7.25, why is this?

> can we use these bitwise operations on letter and special character? think ASCII
> 

---

**Assignment Operations**

1. = 

Yes! that’s it! well to be completely honest that is not true but the rest can be derived by combining ‘=’ with Arithmetic and Bit-wise operators, here’s how:

num += 2 → num = num + 2
num *= 2 → num = num * 2
num %= 2 → num = num%2

See it’s so simple! and the same can be done with Bit-wise operators:

a &= b → a = a & b
a |= b → a = a | b
a ^= b → a = a ^ b

With the same principle it can be extended to all the other operators

---

Besides these there is another set of operators called **Ternary Operators** , about which I will discuss under the Loops section

### Loops 🔁

**If-Else Loop**

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int a = 5;
    int b = 6;
    if(a < b) {
        printf("a is less than b\n");
    } else if (a == b) {
        printf("a is equal to b\n");
    } else {
        printf("a is greater than b\n");
    }

    return 0;
}
```

> Image from raw Notion export omitted until the asset-import phase.

**If-else** loop sequentially goes through checking each condition and executes the ones which are true, the **else** statement is executed when none of the foregoing condition are met, you might have noticed that the else statement is not followed by any condition.

**Switch**

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char grade = 'B';

    switch (grade) {
        case 'A':
            printf("Excellent!\n");
            break;
        case 'B':
            printf("Well done!\n");
            break;
        case 'C':
            printf("You passed!\n");
            break;
        case 'D':
            printf("You failed!\n");
            break;
        case 'F':
            printf("You flunked the exam!\n");
            break;
        default:
            printf("Invalid grade\n");
            break;
    }

    return 0;
}
```

The **switch** statement can be used in place of **if-else** in senarios where one paticular variable/constant has to be compared with a myriad of different value

An intresting this to note is that the **switch** is significantly faster than the **if-else** statement , and hence should be used wherever and whenever it can be used

> Image from raw Notion export omitted until the asset-import phase.

An important keyword is the **break** statement, once called it exits the loop. Here we have used **break** to avoid executing all the commands after the true condition, had it not been present all the code below “Well done!” would have been executed.

Here we will comapare the speed at which these loops operate: 

I wrote a simple code to figure out the value of a from a list of 100 natural numbers,first I used **if-else** statement after which I did the same thing with **switch** statement 👇

> Image from raw Notion export omitted until the asset-import phase.

> Image from raw Notion export omitted until the asset-import phase.

Although the difference is sub 20-30 hundereths of a seconds, the difference can escalte quickly in larger and more complex programs

**For Loop**

```c
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
    for(int i = 0; i < 10; i++) {
        printf("%i\n", i);
    }  
    return 0;
}
```

The **For loop** is the best, 😄 ok let me clarify. Here’s how a for loop works first the condition is checked, this might seem trivial to point but this is come to come handy later on. After the the condition returns true the code is executed. That is the basic overview now let’s look closer — the basic structure of a typical **for loop** is:
**for(initialize;condition;increment){code}**  

> Image from raw Notion export omitted until the asset-import phase.

The **intialize** statement acts as a starting point for the loop, **condition** statement is the actual condition which will be checked each time the loop runs and the **increament** statement can be an increament or decreament or anything the point is it forwards the loop.

> Presence of each statement is not mandatory however the presecnce of the three ‘**;**’ is mandatory also you cannot switch up the order of **initialize condition** and **increament** — each “section” is reserved for each respectively , however you can leave them blank. The following 3 codes ouput the same result - carefully look at the **for loop**
> 

```c
#include <stdio.h>

int main(void) {
    int i = 0;
    for(;;) {  
        if (i >= 10) break;  
        printf("%i\n", i);
        i++;  
    }
    return 0;
}

```

👆 **for loop** without **initialize**, **condition** or **increment**

```c
#include <stdio.h>

int main(void) {
    int i = 0;
    for(; i < 10;) {
        printf("%i\n", i);
        i++; 
    }
    return 0;
}

```

👆 **for loop** without **initialize** or **increment**

```c
#include <stdio.h>

int main(void) {
    int i = 0;
    for(; i < 10; i++) {
        printf("%i\n", i);
    }
    return 0;
}

```

👆 **for loop** without **initialize** , 👈 hey look the Irish Flag 🇮🇪, btw I am not Irish

**While Loop**

```c
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
    int i = 0;
    while(i < 10) {
        printf("%i\n", i);
        i++;
    }   
    return 0;
}

```

> Image from raw Notion export omitted until the asset-import phase.

The **while loop** has close resemblance to the **for loop** however they vary quite once you understand them. For starters the **while loop** executes the code before it checks the condition so even when if the conditions is false it executes atleast once. Another thing you might have noticed is that it only takes the condition rest you need to handle else where

It is recommended that you use **while loop** when the number of iterations is not known and use **for loop** when it is known

---

So that is all the types of loops you need to know right now but we still need to discuss 3 things:

1. Ternary operators
2. Nested loops
3. Frequent structures

**Ternary Operators**

```c
#include <stdio.h>

int main() {
    int age = 18;
    char *category;

    category = (age < 13) ? "Child" :
               (age >= 13 && age < 20) ? "Teenager" :
               (age >= 20 && age < 65) ? "Adult" :
               "Senior";

    printf("The category is %s\n", category);

    return 0;
}

```

**Ternary operators** are used for conciseness in places where a true/false type statement needs to be checked, it can be used in place of the  **if-else** and **switch loops**. The basic structure is :

`condition1 ? expression_if_true : condition2 ? expression_if_true : expression_if_false;` 

Another advantage of **Ternary operators**  is that they can be used inline :

`printf("The number is %s\n", (number % 2 == 0) ? "even" : "odd");` 👈 this will output the same result as

```c
if(number%2 == 0){
		printf("The number is even\n")
} else {
		printf("The number is odd\n")
}
```

Yet another way they can compact our code is using nesting but we will discuss that under next sections

**Nested Loops**

**Nested loops** are exactly what they sound like - loops running inside another loops, this provides a whole another dimesion of tools to play with 

```c
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
 for(int i = 0; i < 10; i++) {
     for (int j = 0; j < 10; j++)
     {
        printf("#");
     }
     printf("\n");
 }  
    return 0;
}
```

Here we can see a **Nested for loop** in action, the first **for** defines the number of rows and the second **for** defines the number of columns — notice the positioning of **printf** statement with **\n** it is outside the second **for** but inside the first one, this in effect enters a new line every the second **for** has completed execution. Following is another example of a nested **if-else** inside **for loop** :

> Image from raw Notion export omitted until the asset-import phase.

```c
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 5; i++) {
        if (i % 2 == 0) {
            printf("Even row, printing #\n");
            for (int j = 0; j < 5; j++) {
                printf("#");
            }
            printf("\n");
        } else {
            printf("Odd row, printing -\n");
            for (int j = 0; j < 5; j++) {
                printf("-");
            }
            printf("\n");
        }
    }
    return 0;
}

```

Now for **nested ternary operators**, the following piece of code:
`max = (a > b) ? (a > c ? a : c) : (b > c ? b : c);` is equivalent to 

```c
 if (a > b) {
        if (a > c) {
            max = a;
        } else {
            max = c;
        }
    } else {
        if (b > c) {
            max = b;
        } else {
            max = c;
        }
    }
```

### Functions 👾

Functions are reusable sections of code which can be invoked(called) - As simple as that! A general rule that I like to follow is convert any piece of code I use more than thrice into a function. First we will see a basic function - it’s structure, implementation, uses etc the new will try to optimize the readability using the function prototypes.

Ok there are multiple things to breakdown here - 

As we can see I have declared a function named `func` with accepts *int* type parameters , these are the data which the function operates on when called. Within the main function we have called the function with the argument arg. Keep in mind that the function has to be passed the same data type which has been declared.

> [!tip]
> The void keyword defines that the functions returns NULL

The void can be changed for any type of datatype which you expect the function to return

---

```c
#include <stdio.h>

double sqr(double num);
//function prototype

int main(void){

    double a = 0;
    printf("Enter the number: ");
    scanf("%lf", &a);

    double result = sqr(a);
    printf("%.2lf", result);

    return 0;
}

double sqr(double num){

    double result = num * num;
    return result;

}
```

```c
#include <stdio.h>

void func(int parameters) {
	/*code*/
};

int main(void){

	int arg;
	func(arg);
	
	return 0;
}
```

Let’s kill 2 birds with one stone - learn about the function prototypes and the return keywords 

The basic problem we encounter is that the compiler need to know about the function before we can call it but this lead to a whole list of functions before the main function but we would like the main function to be the foremost hence to overcome this  problem we use function prototypes. It let’s us use a function before it is defined. Here `double sqr(double num);` is the function prototype for the `sqr` function. After the main function we can go ahead and define all the various functions

Now the return keyword just tells the function what to out - that’s literally it.

> [!tip]
> The boilerplate `return 0;` does the same thing it  returns an *int* 0 to let the machine that the code has been done executing

### Scope

In C, the **scope** of a variable determines where the variable can be accessed within a program. Understanding scope is crucial for writing correct and maintainable code. Basically its the “scope” of a variable’s reach. Variables **can** have the same name if the are in different scopes

1. Block Scope
2. Function Scope
3. File Scope
4. Prototype Scope

**Block Scope**

```c
int main(void) {
    int a = 10; // 'a' has block scope within main

    if (a > 5) {
        int b = 20; // 'b' has block scope within the if statement
        printf("%d\n", b); // This is valid
    }

    // printf("%d\n", b);This would be invalid as 'b' is not accessible
    return 0;
}

```

Variables declared within a block (i.e., within **{}**) have block scope. They are only accessible within that block and are not visible outside of it.

**Function Scope**

```c
#include <stdio.h>

void example(void) {
    int x = 10;
    goto label; // This is valid

    {
        label:
        printf("Inside label\n");
    }
}

int main(void) {
    example();
    return 0;
}
```

Labels (used with **goto**) have function scope. They are accessible anywhere within the function they are declared in, regardless of block boundaries.

**File Scope**

```c
#include <stdio.h>

int global_var = 100; // 'global_var' has file scope

void foo(void) {
    printf("%d\n", global_var); // This is valid
}

int main(void) {
    printf("%d\n", global_var); // This is valid
    return 0;
}
```

Variables declared outside of any function (at the top level of a file) have file scope. They are accessible from the point of declaration to the end of the file

```c
#include <stdio.h>

static int static_var = 200; /* 'static_var' has file scope but
															is only visible in this file*/

void foo(void) {
    printf("%d\n", static_var); // This is valid
}

int main(void) {
    printf("%d\n", static_var); // This is valid
    return 0;
}
```

To limit the visibility of such variables to the file in which they are declared, the **static** keyword is used.

**Prototype File**

Variables declared in the parameter list of a function prototype have prototype scope. This scope is limited to the function's parameter list.These parameter names are only placeholders in the prototype; they don't have any effect outside this context.

```c
void func(int a, int b); // 'a' and 'b' have prototype scope
```

**Storage Classes and Scope**

The storage class of a variable affects its scope and lifetime. The main storage classes in C are **auto**, **register**, **static**, and **extern**.

1. **auto**: This is the default storage class for local variables. They have block scope and automatic storage duration.
2. **register**: Suggests that the variable be stored in a CPU register if possible. It also has block scope and automatic storage duration.
3. **static**: Extends the lifetime of a variable to the entire program execution, but limits its scope depending on where it is declared:
    - If declared inside a function, it retains its value between function calls but is only accessible within that function (block scope with static storage duration).
    - If declared at the file level, it is accessible only within that file (file scope with static storage duration).
4. **extern**: Declares a global variable or function in another file. It tells the compiler that the variable or function is defined in another file. It has file scope.

```c
#include <stdio.h>

int global_var = 100; // File scope

void foo(void) {
    static int static_var = 200; /* Block scope but static
																    storage duration*/
    printf("%d\n", static_var);
    static_var++;
}

int main(void) {
    extern int global_var; /*References the global variable
													   declared above*/
    printf("%d\n", global_var);
    foo();
    foo();
    return 0;
}

```

### Arrays

Arrays are a collection of variables with a pre defined size
We can initiate arrays using the following syntax:
`int numbers[]= {1,2,3,4,5};` . However if we try to print this array we get the following result

> Image from raw Notion export omitted until the asset-import phase.

Any guess what is this random number we get? It’s actually the pointer for the array - which is a topic we will cover later on
To print the elements of the array properly we need to mention which index are we talking about:
`printf("%d", numbers[0]);` This will display the first element of our array

> [!tip]
> In C we can pass out of bounds values for an array’s index (such as 5 onwards in this case) which will output garbage values - In most languages we do have certain guard rails to prevent this but we dont have that luxury in C

In this code we use the for loop to print out all the elements of the array and in the next part we see how a string is also an array. We can treat a string exactly as an array manipulating it as we do with arrays.

One piece of code with I want to talk about here is the `i < sizeof(array)/sizeof(array[0])` 

sizeof(array) gives the size in bytes it is divided by sizeof(array[0]) to get the number of elements

```c
#include <stdio.h>

int main(void) {

    int array[5] = {1, 2, 3, 4, 5};

    for (int i = 0; i < sizeof(array)/sizeof(array[0]); i++) {   
        printf("%d\n", array[i]);
    }

    char name[] = "Bro Code";
    printf("%c\n", name[4]);
    printf("%s\n", name);
    printf("%d\n",sizeof(name));
    return 0;
}
```

2D Arrays

2D arrays can be thought of as an array of arrays. It is initialized as `int numbers[][2] = { {1,2}, {2,3} };` we use 2 [] to signify it being a 2D array. Another thing to notice that we have declared the size for the second [] but not the first - this is a necessity required by C - we can leave out the size of rows but for columns it’s a must

### TypeDef

Typedef gives a sot of nickname to an existing type which makes the code more readable 

`typedef int Number;`  👈 This will let us declare *int* using Numbers a better usecase of the typedef keyword would be renaming char to make it more readable and work more like most programming languages `typedef char string[50];` 👈 this will let us declare strings without that pesky syntyax we could just do `string name = "Hello World!";` and it would work pefectly fine

> [!tip]
> Here we had defined the size of the string to be 50 however if we use a pointer we can get away without specifying one
`typedef char* string;`

### Enums

**Enums** are user defines data type that consists of a set of named integer constants hence replacing numbers by strings making the code more readable

The basic syntax to declare enums is 

```c
#include <stdio.h>

enum Day{ 
		SUNDAY, MONDAY, TUESDAY
};

int main(void){

		enum Day today = SUNDAY;

return 0;
}
```

But we can use the *typedef* keyword to avoid typing out enum everytime saving time and making the code more readable

In an enum the first element is always initaitized as 0 and the 1 and so on however even can initiatized the first element to be anything. Another thing note is that all elements of an enum should be capitalized.

```c
#include <stdio.h>

typedef enum{
    MONDAY,TUESDAY,WEDNESDAY,THRUSDAY,FRIDAY,SATURDAY,SUNDAY
}Day;

int daysleft(int day);

int main (void){

    Day today = SUNDAY;

    printf("Days left in this week: %d",daysleft(today));

    return 0;
}

int daysleft(int day){

    int result = 6 - day;
    return  result;

}
```

In this code we use a function `daysleft` to let the user know how many days are left in the week

### Structs

**Struct** are custom containers which contains multiple peices of related information, you can think of them as a blueprint of a structure. We can use them as a custom variable which can encode multiple related peices of information.

If this isnt your first time learning a programming language there is a chance you might have already equated this with **objects** of other languages

We can initialize a struct using the following syntax:

```c
typedef struct {
	
	int a;
	int b;
	char c[16];
	
}Name;
```

Here we can define the struct without using the *typedef* keyword but the you would have type out struct everytime you want use so I would reccomend using it exclusively with *typedef*

To get the value of a paticular element from a struct we use the following syntax 👉

```c
printf("%d\n", Name.a);
```

With this code we aim to declare different students with thier respective names, ages, GPAs and wheter or not they are full time or not.

```c
#include <stdio.h>
#include <stdbool.h>

typedef struct {

    char name[50];
    int age;
    float gpa;
    bool isFullTime;

}Student;

void printStudent(Student student);

int main(void){

    Student student1 = {"Ash", 15 , 4, false};
    Student student2 = {"Misty", 15 , 4, true};
    Student student3 = {"Brock", 20 , 4, true};
    
    printStudent(student1);
    printStudent(student2);
    printStudent(student3);
    
    return 0;
}

void printStudent(Student student){
    printf("Name: %s\n", student.name);
    printf("Age: %d\n", student.age);
    printf("GPA: %.2f\n", student.gpa);
    printf("Fulltime? : %s\n", (student.isFullTime) ? "Yes" : "No");
    printf("\n");
    
} 
```

**Array of Structs**

Instead of using using the printf statement each time to display the data of each student we can recall the 3 times rule and employ arrays and for loop to display the student info 👇

```c
#include <stdio.h>
#include <stdbool.h>

typedef struct {

    char name[50];
    int age;
    float gpa;
    bool isFullTime;

}Student;

void printStudent(Student student);

int main(void){

    Student students[] = {{"Ash", 15 , 4, false},
                          {"Misty", 15 , 4, true},
                          {"Brock", 20 , 4, true}};

    for ( int i = 0; i < sizeof(students)/sizeof(students[0]); i++){
            printStudent(students[i]);
    };
       
    return 0;
}

void printStudent(Student student){
    printf("Name: %s\n", student.name);
    printf("Age: %d\n", student.age);
    printf("GPA: %.2f\n", student.gpa);
    printf("Fulltime? : %s\n", (student.isFullTime) ? "Yes" : "No");
    printf("\n");
    
}
```

### File Manipulations

C has in built functions for file manupulation with 3 modes:

1. w 👉 write mode 
2. a 👉 append mode (unlike write mode doesn’t overwrite existing data)
3. r 👉 read mode

To open a file we use the following syntax:

```c
char mode = 'a';
char file_mode[2];

file_mode[0] = mode;
file_mode[1] = '\0';

FILE *pfile = fopen("address.txt", file_mode);
			/*code*/
fclose(pfile);
```

We could have simplified it a lot more and avoided the use of 2 extra variables and just written `FILE *pfile = fopen("address.txt", 'a');` but I would reccomend this structure as you can take in user input by asking the user for the value of the mode variable

`fclose(pfile);` just makes sures you have closed the file after use

```c
fprintf(pfile, "\n%s", text);
```

We use `fprintf` to print our text in the file. Now let’s try to figure out the following peice of code

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char text[64];
    char mode;
    char file_mode[2];

    printf("Enter mode (a = append, w = overwrite): ");
    scanf(" %c", &mode);

    if (mode != 'a' && mode != 'w') {
        printf("Invalid mode.\n");
        return 1;
    }

    file_mode[0] = mode;
    file_mode[1] = '\0';

    FILE *pfile = fopen("text.txt", file_mode);

    if (pfile == NULL) {
        printf("Error opening file\n");
        return 1;
    }

    printf("Enter your full text: ");
    getchar(); 
    fgets(text, sizeof(text), stdin);

    if (text[strlen(text) - 1] == '\n') {
        text[strlen(text) - 1] = '\0';
    }

    fprintf(pfile, "\n%s", text);

    fclose(pfile);
    return 0;
}
```

It’s a pretty basic code which justs takes inputs from the user and prints it into the file.

Now let’s see how to read a file:

The major takeaway is the use of buffer to store the data from the file and display it on the terminal. We use the fgets function to take the data from the file and store it in buffer.

```c
#include <stdio.h>

int main(){

    FILE  *pfile = fopen("text.txt", "r");
    char buffer[1024] = {0};

    if (pfile == NULL){
        printf("Error");
        return 1;
    }

    while(fgets(buffer, sizeof(buffer), pfile) != NULL){
        printf("%s", buffer);
    }

    fclose(pfile);

    return 0;
}
```

### Libraries

**termios.h**

- `tcgetattr()`  :

### **Frequent Structures**

This section will list couple of useful structure which are versatile and can be used in a myriad of different situations, this by no means an exhaustive list but just a starting point to build your own repertoire 

1. **User Exit**

This is a very simple structure which let’s the user interact with the as long as the user wishes. This is obtained by initializing a **char** ‘mode’ and using the **scanf** statement to input the desired value. Next we check if mode is equal to ‘E’ ( for Exit ) using a **ternary** operator and if it is we break from the loop, If its not the flow continues to use the **switch** statement to execute the correct set of code. This will run infinitely until the user wants to exit. The value passed in **while loop** is 1, and as 1 will always be equal to 1 the loop never ends 

```c
while(1){
	char mode;
	scanf(" %c",mode)
	
	mode == 'E'? break : 0;
	
	switch (mode) {
		case A:
			/* code */
		case B:
			/* code */
		default:
			Invalid Input
	}
}
```

1. **Pseudo-random Number Generator**
    
    This uses the time as a seed to generate a seemingly random number
    
    ```c
    #include <stdio.h>
    #include <stdlib.h>
    #include <time.h>
    
    int main(){
    
        srand(time(NULL));
    
        int min = 50;
        int max = 100;
    
        int randomNum = (rand() % (max - min + 1)) + min;
    
        printf("%d", randomNum);
    
        return 0;
    }
    ```
    
2. **Input List of strings**
    
    ```c
    #include <stdio.h>
    #include <string.h>
    
    int manin(void) {
    
    		char names[4][25] = {0};
    		
    		for(int i = 0; i <sizeof(names)/sizeof(names[0], stdin){
    				printf("Enter a name: ");
    				fgets(names[i], sizeof(names[i]), stdin);
    				names[i][strlen(names[i]) - 1] = '\0';
    				}
    
    return 0;
    }
    ```
    

---

> So that’s it! Yes really that almost all you need to know to write your own programs in C, Yes yes I know “But where are the pointers and malloc and stuff??” I felt that they are such an important topic that they deserve a website of their own. I will try to explain pointers and such in C with great detail , employing Assembly to give you a much deeper understanding of the topic. I will also discuss the various types of data structures and their underlying concepts.
>
